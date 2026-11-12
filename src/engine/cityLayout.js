import * as THREE from 'three';

/**
 * Calculates 3D world positions, dimensions, and layout for districts, buildings, and dependency highways.
 */
export function computeCityLayout(analysisData) {
  const { districts, links } = analysisData;
  const buildingMap = new Map(); // id -> building layout node

  const DISTRICT_PADDING = 8;
  const BUILDING_GAP = 5;
  const ROAD_WIDTH = 18;

  // 1. First Pass: Compute internal layout for each district
  const districtLayouts = districts.map((district) => {
    const files = district.files;
    const count = files.length;

    // Arrange buildings in an approximate square grid within the district
    const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
    const rows = Math.max(1, Math.ceil(count / cols));

    const buildings = [];
    let maxColWidth = 0;
    let maxRowDepth = 0;

    // First, determine building dimensions
    files.forEach((file) => {
      // Height proportional to Lines of Code (LOC)
      const height = Math.min(110, Math.max(4, Math.round(file.loc * 0.25)));

      // Footprint (width & depth) proportional to complexity
      const footprint = Math.min(14, Math.max(4.5, 4 + Math.round(file.complexityScore * 0.35)));

      buildings.push({
        file,
        w: footprint,
        h: height,
        d: footprint,
        localX: 0,
        localZ: 0
      });
    });

    // Lay out buildings in rows & columns
    let currentZ = DISTRICT_PADDING;
    let districtWidth = 0;

    for (let r = 0; r < rows; r++) {
      let currentX = DISTRICT_PADDING;
      let rowMaxDepth = 0;

      for (let c = 0; c < cols; c++) {
        const index = r * cols + c;
        if (index >= buildings.length) break;

        const b = buildings[index];
        b.localX = currentX + b.w / 2;
        b.localZ = currentZ + b.d / 2;

        currentX += b.w + BUILDING_GAP;
        rowMaxDepth = Math.max(rowMaxDepth, b.d);
      }

      districtWidth = Math.max(districtWidth, currentX - BUILDING_GAP + DISTRICT_PADDING);
      currentZ += rowMaxDepth + BUILDING_GAP;
    }

    const districtDepth = currentZ - BUILDING_GAP + DISTRICT_PADDING;

    // Center buildings relative to district center (0, 0)
    buildings.forEach(b => {
      b.localX -= districtWidth / 2;
      b.localZ -= districtDepth / 2;
    });

    return {
      district,
      buildings,
      width: Math.max(districtWidth, 24),
      depth: Math.max(districtDepth, 24),
      worldX: 0,
      worldZ: 0
    };
  });

  // 2. Second Pass: Arrange districts on the city world map (Multi-Row Boulevard Grid)
  const totalDistricts = districtLayouts.length;
  const distCols = Math.max(1, Math.ceil(Math.sqrt(totalDistricts)));

  let rowDistricts = [];
  let currentWorldZ = 0;
  let maxCityWidth = 0;

  for (let i = 0; i < totalDistricts; i++) {
    rowDistricts.push(districtLayouts[i]);

    if (rowDistricts.length === distCols || i === totalDistricts - 1) {
      // Calculate row width and row max depth
      const rowWidth = rowDistricts.reduce((sum, d) => sum + d.width, 0) + (rowDistricts.length - 1) * ROAD_WIDTH;
      const rowDepth = Math.max(...rowDistricts.map(d => d.depth));
      maxCityWidth = Math.max(maxCityWidth, rowWidth);

      let currentWorldX = -rowWidth / 2;

      rowDistricts.forEach(d => {
        d.worldX = currentWorldX + d.width / 2;
        d.worldZ = currentWorldZ + rowDepth / 2;
        currentWorldX += d.width + ROAD_WIDTH;

        // Position each building in 3D world space
        d.buildings.forEach(b => {
          const worldBx = d.worldX + b.localX;
          const worldBz = d.worldZ + b.localZ;
          const worldBy = b.h / 2; // Sits flush on ground

          const buildingNode = {
            id: b.file.id,
            file: b.file,
            districtName: d.district.name,
            districtId: d.district.id,
            x: worldBx,
            y: worldBy,
            z: worldBz,
            w: b.w,
            h: b.h,
            d: b.d,
            roofPoint: new THREE.Vector3(worldBx, b.h, worldBz)
          };

          buildingMap.set(b.file.id, buildingNode);
        });
      });

      currentWorldZ += rowDepth + ROAD_WIDTH;
      rowDistricts = [];
    }
  }

  // Recenter entire city around (0, 0, 0)
  const cityCenterZ = currentWorldZ / 2;
  districtLayouts.forEach(d => {
    d.worldZ -= cityCenterZ;
  });
  buildingMap.forEach(b => {
    b.z -= cityCenterZ;
    b.roofPoint.z -= cityCenterZ;
  });

  // 3. Third Pass: Build 3D Dependency Spline Curves
  const dependencyHighways = [];

  links.forEach(link => {
    const fromBuilding = buildingMap.get(link.from);
    const toBuilding = buildingMap.get(link.to);

    if (fromBuilding && toBuilding) {
      const p1 = fromBuilding.roofPoint.clone();
      const p2 = toBuilding.roofPoint.clone();

      // Arched midpoint in the sky
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const distance = p1.distanceTo(p2);
      mid.y += Math.max(15, distance * 0.35); // Higher arch for longer distances

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(24);

      dependencyHighways.push({
        fromId: fromBuilding.id,
        toId: toBuilding.id,
        curve,
        points
      });
    }
  });

  const citySize = Math.max(maxCityWidth, currentWorldZ, 120);

  return {
    districts: districtLayouts,
    buildings: Array.from(buildingMap.values()),
    buildingMap,
    highways: dependencyHighways,
    citySize
  };
}
