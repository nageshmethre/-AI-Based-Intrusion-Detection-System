import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getBuildingTexture, getLanguageInfo } from '../engine/themeColors.js';

export default function CityCanvas({
  layout,
  selectedBuilding,
  onSelectBuilding,
  filters,
  cameraPreset,
  onCameraUpdate,
  teleportCoords
}) {
  const mountRef = useRef(null);
  const [hoveredBuilding, setHoveredBuilding] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Store Three.js instances for lifetime management
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const buildingMeshesRef = useRef(new Map()); // fileId -> mesh
  const highwayMeshesRef = useRef([]);
  const targetCamPosRef = useRef(null);
  const targetLookAtRef = useRef(null);
  const onCameraUpdateRef = useRef(onCameraUpdate);
  onCameraUpdateRef.current = onCameraUpdate;

  // 1. Initialize Scene & Renderer
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712');
    scene.fog = new THREE.FogExp2('#030712', 0.0032);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    camera.position.set(160, 140, 200);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't dip below ground
    controls.minDistance = 15;
    controls.maxDistance = 1000;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight('#38bdf8', 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#ffffff', 1.4);
    dirLight.position.set(150, 250, 150);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 800;
    const d = 250;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    const blueRimLight = new THREE.DirectionalLight('#06b6d4', 0.8);
    blueRimLight.position.set(-150, 100, -150);
    scene.add(blueRimLight);

    const purpleLight = new THREE.PointLight('#a855f7', 1.2, 500);
    purpleLight.position.set(0, 80, 0);
    scene.add(purpleLight);

    // Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera transition if target exists
      if (targetCamPosRef.current && targetLookAtRef.current) {
        camera.position.lerp(targetCamPosRef.current, 0.05);
        controls.target.lerp(targetLookAtRef.current, 0.05);
        if (camera.position.distanceTo(targetCamPosRef.current) < 0.5) {
          targetCamPosRef.current = null;
          targetLookAtRef.current = null;
        }
      }

      controls.update();

      // Animate glowing dependency splines (dash offset or pulse)
      highwayMeshesRef.current.forEach((item) => {
        if (item.line && item.material) {
          if (item.active) {
            item.material.opacity = 0.85 + Math.sin(elapsedTime * 6) * 0.15;
          }
        }
      });

      // Animate hazard beacons on monolithic buildings
      buildingMeshesRef.current.forEach((item) => {
        if (item.beaconMesh) {
          item.beaconMesh.material.opacity = 0.5 + Math.sin(elapsedTime * 4) * 0.5;
        }
      });

      // Periodic camera position update for Google Minimap Radar
      if (Math.floor(elapsedTime * 10) % 2 === 0 && onCameraUpdateRef.current) {
        onCameraUpdateRef.current({
          pos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
          target: { x: controls.target.x, y: controls.target.y, z: controls.target.z }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // 2. Build 3D City whenever layout updates
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !layout) return;

    // Clear previous city objects
    const toRemove = [];
    scene.traverse((obj) => {
      if (obj.userData && obj.userData.isCityElement) {
        toRemove.push(obj);
      }
    });
    toRemove.forEach((obj) => {
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });

    buildingMeshesRef.current.clear();
    highwayMeshesRef.current = [];

    const citySize = Math.max(layout.citySize * 1.5, 300);

    // Neon Cyber Ground Plane
    const gridHelper = new THREE.GridHelper(citySize, 80, '#06b6d4', '#1e293b');
    gridHelper.position.y = -0.05;
    gridHelper.userData = { isCityElement: true };
    scene.add(gridHelper);

    // Dark Floor Base
    const floorGeo = new THREE.PlaneGeometry(citySize * 1.5, citySize * 1.5);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#020617',
      roughness: 0.9,
      metalness: 0.1
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.1;
    floorMesh.receiveShadow = true;
    floorMesh.userData = { isCityElement: true };
    scene.add(floorMesh);

    // 3. Render Districts (Foundations and Sidewalk Curbs)
    layout.districts.forEach((d) => {
      // Raised District Platform
      const padW = d.width + 4;
      const padD = d.depth + 4;
      const distGeo = new THREE.BoxGeometry(padW, 0.8, padD);
      const distMat = new THREE.MeshStandardMaterial({
        color: '#090d16',
        roughness: 0.7,
        metalness: 0.3
      });
      const distMesh = new THREE.Mesh(distGeo, distMat);
      distMesh.position.set(d.worldX, 0.4, d.worldZ);
      distMesh.receiveShadow = true;
      distMesh.userData = { isCityElement: true };
      scene.add(distMesh);

      // Glowing Cyan Border around district
      const edges = new THREE.EdgesGeometry(distGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: '#0ea5e9', linewidth: 1.5 });
      const borderLine = new THREE.LineSegments(edges, lineMat);
      borderLine.position.copy(distMesh.position);
      borderLine.userData = { isCityElement: true };
      scene.add(borderLine);

      // District Floating Billboard Label
      const labelSprite = createDistrictLabelSprite(d.district.name);
      labelSprite.position.set(d.worldX, 3.5, d.worldZ - padD / 2 - 2);
      labelSprite.userData = { isCityElement: true };
      scene.add(labelSprite);
    });

    // 4. Render Buildings (Skyscrapers)
    layout.buildings.forEach((b) => {
      const lang = b.file.language;
      const texture = getBuildingTexture(lang.color, b.file.isMonolith);

      const boxGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
      
      // Building Materials: Roof and Walls
      const wallMat = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: texture,
        roughness: 0.35,
        metalness: 0.6,
        emissive: lang.color,
        emissiveIntensity: 0.15
      });

      const roofMat = new THREE.MeshStandardMaterial({
        color: b.file.isMonolith ? '#dc2626' : lang.color,
        roughness: 0.4,
        metalness: 0.8,
        emissive: lang.color,
        emissiveIntensity: 0.4
      });

      // Box materials: [right, left, top, bottom, front, back]
      const materials = [wallMat, wallMat, roofMat, wallMat, wallMat, wallMat];

      const mesh = new THREE.Mesh(boxGeo, materials);
      mesh.position.set(b.x, b.y + 0.8, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { isCityElement: true, isBuilding: true, buildingData: b };

      // Edges highlight on building
      const edges = new THREE.EdgesGeometry(boxGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: b.file.isMonolith ? '#ef4444' : lang.color,
        transparent: true,
        opacity: 0.4
      });
      const edgeLines = new THREE.LineSegments(edges, edgeMat);
      mesh.add(edgeLines);

      // Red flashing beacon atop monolithic / complex buildings
      let beaconMesh = null;
      if (b.file.isMonolith) {
        const beaconGeo = new THREE.SphereGeometry(1.2, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: '#ff0000',
          transparent: true,
          opacity: 0.8
        });
        beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        beaconMesh.position.set(0, b.h / 2 + 1.2, 0);
        mesh.add(beaconMesh);

        // Warning antenna spire
        const spireGeo = new THREE.CylinderGeometry(0.1, 0.4, 3, 6);
        const spireMat = new THREE.MeshStandardMaterial({ color: '#ef4444' });
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.set(0, b.h / 2 + 1.5, 0);
        mesh.add(spire);
      }

      scene.add(mesh);

      buildingMeshesRef.current.set(b.file.id, {
        mesh,
        building: b,
        edgeLines,
        beaconMesh,
        originalEmissiveIntensity: 0.15
      });
    });

    // 5. Render Dependency Highways (Cyber Arcs)
    layout.highways.forEach((highway) => {
      const curveGeo = new THREE.BufferGeometry().setFromPoints(highway.points);
      const curveMat = new THREE.LineBasicMaterial({
        color: '#06b6d4',
        transparent: true,
        opacity: 0.22,
        linewidth: 2
      });
      const line = new THREE.Line(curveGeo, curveMat);
      line.userData = { isCityElement: true, isHighway: true, highway };
      scene.add(line);

      highwayMeshesRef.current.push({
        highway,
        line,
        material: curveMat,
        active: false
      });
    });

    // Adjust camera to fit city
    if (controlsRef.current && cameraRef.current) {
      const distance = Math.max(layout.citySize * 1.1, 140);
      cameraRef.current.position.set(distance * 0.8, distance * 0.7, distance);
      controlsRef.current.target.set(0, 10, 0);
      controlsRef.current.update();
    }
  }, [layout]);

  // 6. Handle Building Selection & Highlight Filter Updates
  useEffect(() => {
    buildingMeshesRef.current.forEach((item, fileId) => {
      const { mesh, building, edgeLines } = item;
      const file = building.file;

      // Filter Visibility Check
      let isVisible = true;
      if (filters?.language && filters.language !== 'all') {
        const langInfo = getLanguageInfo(file.name);
        if (langInfo.name.toLowerCase() !== filters.language.toLowerCase()) {
          isVisible = false;
        }
      }
      if (filters?.showMonolithsOnly && !file.isMonolith) {
        isVisible = false;
      }

      mesh.visible = isVisible;

      // Selection Highlight Logic
      const isSelected = selectedBuilding && selectedBuilding.file.id === fileId;
      const isDependency = selectedBuilding && selectedBuilding.file.dependencies.includes(fileId);
      const isDependent = selectedBuilding && selectedBuilding.file.dependents.includes(fileId);

      const wallMat = mesh.material[0];
      const roofMat = mesh.material[2];

      if (!selectedBuilding) {
        // Normal city state
        wallMat.emissiveIntensity = 0.15;
        roofMat.emissiveIntensity = 0.4;
        edgeLines.material.opacity = 0.35;
        mesh.scale.set(1, 1, 1);
      } else if (isSelected) {
        // Selected Building (Bright Golden Cyber Glow)
        wallMat.emissive.set('#38bdf8');
        wallMat.emissiveIntensity = 0.85;
        roofMat.emissive.set('#38bdf8');
        roofMat.emissiveIntensity = 1.0;
        edgeLines.material.color.set('#38bdf8');
        edgeLines.material.opacity = 1.0;
      } else if (isDependency) {
        // Files this building imports (Neon Cyan)
        wallMat.emissive.set('#06b6d4');
        wallMat.emissiveIntensity = 0.6;
        roofMat.emissive.set('#06b6d4');
        roofMat.emissiveIntensity = 0.8;
        edgeLines.material.color.set('#06b6d4');
        edgeLines.material.opacity = 0.9;
      } else if (isDependent) {
        // Files that import this building (Neon Magenta / Pink)
        wallMat.emissive.set('#ec4899');
        wallMat.emissiveIntensity = 0.6;
        roofMat.emissive.set('#ec4899');
        roofMat.emissiveIntensity = 0.8;
        edgeLines.material.color.set('#ec4899');
        edgeLines.material.opacity = 0.9;
      } else {
        // Dim unselected buildings for focus
        wallMat.emissiveIntensity = 0.04;
        roofMat.emissiveIntensity = 0.1;
        edgeLines.material.opacity = 0.1;
      }
    });

    // Update Highways based on selection
    highwayMeshesRef.current.forEach((item) => {
      const { highway, material } = item;
      if (!selectedBuilding) {
        material.color.set('#06b6d4');
        material.opacity = 0.2;
        item.active = false;
      } else {
        const isFrom = highway.fromId === selectedBuilding.file.id;
        const isTo = highway.toId === selectedBuilding.file.id;

        if (isFrom) {
          // Outgoing dependency
          material.color.set('#06b6d4');
          material.opacity = 0.95;
          item.active = true;
        } else if (isTo) {
          // Incoming dependent
          material.color.set('#ec4899');
          material.opacity = 0.95;
          item.active = true;
        } else {
          // Unrelated
          material.opacity = 0.03;
          item.active = false;
        }
      }
    });

    // Smoothly focus camera on selected building
    if (selectedBuilding && cameraRef.current && controlsRef.current) {
      const b = selectedBuilding;
      targetCamPosRef.current = new THREE.Vector3(b.x + 35, b.y + b.h * 0.7 + 30, b.z + 45);
      targetLookAtRef.current = new THREE.Vector3(b.x, b.y, b.z);
    }
  }, [selectedBuilding, filters]);

  // 7. Handle Camera Presets
  useEffect(() => {
    if (!cameraPreset || !cameraRef.current || !controlsRef.current || !layout) return;

    const size = Math.max(layout.citySize, 150);

    if (cameraPreset === 'isometric') {
      targetCamPosRef.current = new THREE.Vector3(size * 0.8, size * 0.7, size * 0.9);
      targetLookAtRef.current = new THREE.Vector3(0, 10, 0);
    } else if (cameraPreset === 'top') {
      targetCamPosRef.current = new THREE.Vector3(0, size * 1.5, 0.1);
      targetLookAtRef.current = new THREE.Vector3(0, 0, 0);
    } else if (cameraPreset === 'street') {
      targetCamPosRef.current = new THREE.Vector3(0, 6, size * 0.45);
      targetLookAtRef.current = new THREE.Vector3(0, 20, 0);
    }
  }, [cameraPreset, layout]);

  // 7b. Handle Teleportation from Google Minimap Radar
  useEffect(() => {
    if (!teleportCoords || !cameraRef.current || !controlsRef.current) return;
    targetCamPosRef.current = new THREE.Vector3(teleportCoords.x + 35, 45, teleportCoords.z + 45);
    targetLookAtRef.current = new THREE.Vector3(teleportCoords.x, 10, teleportCoords.z);
  }, [teleportCoords]);

  // 8. Raycasting for Hover & Click Events
  const handlePointerMove = (e) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    setMousePos({ x: e.clientX, y: e.clientY });

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    const hit = intersects.find((i) => i.object.userData && i.object.userData.isBuilding);

    if (hit) {
      container.style.cursor = 'pointer';
      setHoveredBuilding(hit.object.userData.buildingData);
    } else {
      container.style.cursor = 'grab';
      setHoveredBuilding(null);
    }
  };

  const handleClick = (e) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    const hit = intersects.find((i) => i.object.userData && i.object.userData.isBuilding);

    if (hit) {
      onSelectBuilding(hit.object.userData.buildingData);
    }
  };

  return (
    <div
      ref={mountRef}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      className="w-full h-full relative"
    >
      {/* Floating Hover Tooltip */}
      {hoveredBuilding && (
        <div
          className="fixed pointer-events-none z-50 px-3.5 py-2.5 bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 rounded-xl shadow-2xl text-xs text-slate-200 min-w-[200px]"
          style={{ left: mousePos.x + 16, top: mousePos.y + 16 }}
        >
          <div className="flex items-center justify-between gap-2 font-bold text-white border-b border-slate-800 pb-1.5 mb-1.5">
            <span className="truncate text-cyan-300">{hoveredBuilding.file.name}</span>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold"
              style={{
                backgroundColor: hoveredBuilding.file.language.color + '22',
                color: hoveredBuilding.file.language.color
              }}
            >
              {hoveredBuilding.file.language.name}
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">District:</span>
              <span className="font-mono text-slate-200 truncate max-w-[120px]">
                {hoveredBuilding.districtName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Height (LOC):</span>
              <span className="font-mono font-semibold text-white">{hoveredBuilding.file.loc} lines</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Complexity:</span>
              <span
                className={`font-mono font-semibold ${
                  hoveredBuilding.file.complexityScore > 20 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                Level {hoveredBuilding.file.complexityScore}
              </span>
            </div>
            {hoveredBuilding.file.isMonolith && (
              <div className="mt-1 pt-1 border-t border-red-500/30 text-red-400 font-bold flex items-center gap-1">
                ⚠️ Monolithic Architecture Alert
              </div>
            )}
            <div className="text-[10px] text-cyan-400/80 pt-1">
              👉 Click to inspect code & highways
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Creates an elegant floating billboard sprite for district titles
 */
function createDistrictLabelSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Semi-transparent dark pill background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
  ctx.lineWidth = 4;
  roundRect(ctx, 16, 20, 480, 88, 24);
  ctx.fill();
  ctx.stroke();

  // Cyan glowing text
  ctx.font = 'bold 36px "Space Grotesk", Inter, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(30, 7.5, 1);
  return sprite;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
