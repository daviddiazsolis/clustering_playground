export type Point2D = [number, number];
export type Point3D = [number, number, number];
export type Point = number[];

export function generateBlobs(n: number): Point2D[] {
  const data: Point2D[] = [];
  const centers = [[0.2, 0.8], [0.8, 0.8], [0.5, 0.2]];
  for (let i = 0; i < n; i++) {
    const c = centers[i % 3];
    data.push([
      c[0] + (Math.random() - 0.5) * 0.15,
      c[1] + (Math.random() - 0.5) * 0.15
    ]);
  }
  return data;
}

export function generateMoons(n: number): Point2D[] {
  const data: Point2D[] = [];
  for (let i = 0; i < n / 2; i++) {
    const theta = Math.random() * Math.PI;
    data.push([
      0.25 + 0.25 * Math.cos(theta) + (Math.random() - 0.5) * 0.05,
      0.5 + 0.25 * Math.sin(theta) + (Math.random() - 0.5) * 0.05
    ]);
  }
  for (let i = 0; i < n / 2; i++) {
    const theta = Math.random() * Math.PI;
    data.push([
      0.5 - 0.25 * Math.cos(theta) + (Math.random() - 0.5) * 0.05,
      0.5 - 0.25 * Math.sin(theta) + (Math.random() - 0.5) * 0.05
    ]);
  }
  return data;
}

export function generateCircles(n: number): Point2D[] {
  const data: Point2D[] = [];
  for (let i = 0; i < n / 2; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const r = 0.2 + (Math.random() - 0.5) * 0.05;
    data.push([0.5 + r * Math.cos(theta), 0.5 + r * Math.sin(theta)]);
  }
  for (let i = 0; i < n / 2; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const r = 0.4 + (Math.random() - 0.5) * 0.05;
    data.push([0.5 + r * Math.cos(theta), 0.5 + r * Math.sin(theta)]);
  }
  return data;
}

export function generateAniso(n: number): Point2D[] {
  const data: Point2D[] = [];
  const centers = [[0.2, 0.2], [0.5, 0.5], [0.8, 0.8]];
  for (let i = 0; i < n; i++) {
    const c = centers[i % 3];
    const x = (Math.random() - 0.5) * 0.3;
    const y = (Math.random() - 0.5) * 0.1; // Anisotropic
    // Rotate 45 degrees
    const rx = x * Math.cos(Math.PI/4) - y * Math.sin(Math.PI/4);
    const ry = x * Math.sin(Math.PI/4) + y * Math.cos(Math.PI/4);
    data.push([c[0] + rx, c[1] + ry]);
  }
  return data;
}

export function generateVaried(n: number): Point2D[] {
  const data: Point2D[] = [];
  const centers = [[0.2, 0.5], [0.5, 0.5], [0.8, 0.5]];
  const stds = [0.05, 0.1, 0.15];
  for (let i = 0; i < n; i++) {
    const clusterIdx = i % 3;
    const c = centers[clusterIdx];
    const std = stds[clusterIdx];
    data.push([
      c[0] + (Math.random() - 0.5) * std * 2,
      c[1] + (Math.random() - 0.5) * std * 2
    ]);
  }
  return data;
}

export function generateNoise(n: number): Point2D[] {
  const data: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    data.push([Math.random(), Math.random()]);
  }
  return data;
}

export function generate3DClouds(n: number): Point3D[] {
  const data: Point3D[] = [];
  const centers = [
    [0.2, 0.8, 0.5],
    [0.8, 0.8, 0.2],
    [0.5, 0.2, 0.8],
    [0.2, 0.2, 0.2]
  ];
  for (let i = 0; i < n; i++) {
    const c = centers[i % 4];
    data.push([
      c[0] + (Math.random() - 0.5) * 0.2,
      c[1] + (Math.random() - 0.5) * 0.2,
      c[2] + (Math.random() - 0.5) * 0.2
    ]);
  }
  return data;
}

// Simple seeded PRNG (mulberry32) — returns values in [0, 1)
function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function kMeans(data: Point[], k: number, maxIter = 100, seed?: number): { assignments: number[], centroids: Point[] } {
  if (data.length === 0) return { assignments: [], centroids: [] };
  const dim = data[0].length;
  const rand = seed !== undefined ? seededRandom(seed) : Math.random;

  const centroids: Point[] = [];
  const indices = new Set<number>();
  while (centroids.length < k && centroids.length < data.length) {
    const idx = Math.floor(rand() * data.length);
    if (!indices.has(idx)) {
      indices.add(idx);
      centroids.push([...data[idx]]);
    }
  }

  const assignments = new Array(data.length).fill(0);
  let changed = true;
  let iter = 0;

  while (changed && iter < maxIter) {
    changed = false;
    
    for (let i = 0; i < data.length; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < k; c++) {
        let distSq = 0;
        for (let d = 0; d < dim; d++) {
          distSq += Math.pow(data[i][d] - centroids[c][d], 2);
        }
        const dist = Math.sqrt(distSq);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = c;
        }
      }
      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    const sums = Array.from({ length: k }, () => new Array(dim).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < data.length; i++) {
      const c = assignments[i];
      for (let d = 0; d < dim; d++) {
        sums[c][d] += data[i][d];
      }
      counts[c]++;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        for (let d = 0; d < dim; d++) {
          centroids[c][d] = sums[c][d] / counts[c];
        }
      }
    }
    iter++;
  }
  return { assignments, centroids };
}

export function dbscan(data: Point[], eps: number, minPts: number): number[] {
  const assignments = new Array(data.length).fill(-1);
  let clusterId = 0;
  const dim = data[0].length;

  function regionQuery(pIdx: number): number[] {
    const neighbors: number[] = [];
    for (let i = 0; i < data.length; i++) {
      let distSq = 0;
      for (let d = 0; d < dim; d++) {
        distSq += Math.pow(data[pIdx][d] - data[i][d], 2);
      }
      if (Math.sqrt(distSq) <= eps) {
        neighbors.push(i);
      }
    }
    return neighbors;
  }

  for (let i = 0; i < data.length; i++) {
    if (assignments[i] !== -1) continue;

    const neighbors = regionQuery(i);
    if (neighbors.length < minPts) {
      assignments[i] = -2;
    } else {
      assignments[i] = clusterId;
      const seedSet = [...neighbors];
      const indexI = seedSet.indexOf(i);
      if (indexI > -1) seedSet.splice(indexI, 1);

      while (seedSet.length > 0) {
        const currentP = seedSet[0];
        const currentNeighbors = regionQuery(currentP);

        if (currentNeighbors.length >= minPts) {
          for (const n of currentNeighbors) {
            if (assignments[n] === -1 || assignments[n] === -2) {
              if (assignments[n] === -1) {
                seedSet.push(n);
              }
              assignments[n] = clusterId;
            }
          }
        }
        seedSet.shift();
      }
      clusterId++;
    }
  }
  return assignments;
}

// Agglomerative Hierarchical Clustering
export interface DendrogramNode {
  id: number;
  left?: DendrogramNode;
  right?: DendrogramNode;
  distance: number;
  size: number;
  pointIdx?: number;
}

export function agglomerativeClustering(data: Point[]): DendrogramNode {
  const n = data.length;
  const dim = data[0].length;
  let nodes: DendrogramNode[] = data.map((_, i) => ({
    id: i,
    distance: 0,
    size: 1,
    pointIdx: i
  }));

  const distMatrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let distSq = 0;
      for (let d = 0; d < dim; d++) {
        distSq += Math.pow(data[i][d] - data[j][d], 2);
      }
      const d = Math.sqrt(distSq);
      distMatrix[i][j] = d;
      distMatrix[j][i] = d;
    }
  }

  let nextId = nodes.length;
  while (nodes.length > 1) {
    let minDist = Infinity;
    let bestI = -1;
    let bestJ = -1;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = distMatrix[nodes[i].id][nodes[j].id];
        if (d < minDist) {
          minDist = d;
          bestI = i;
          bestJ = j;
        }
      }
    }

    const nodeA = nodes[bestI];
    const nodeB = nodes[bestJ];
    const newNode: DendrogramNode = {
      id: nextId++,
      left: nodeA,
      right: nodeB,
      distance: minDist,
      size: nodeA.size + nodeB.size
    };

    // Update distMatrix for the new node
    distMatrix[newNode.id] = [];
    for (let k = 0; k < nextId; k++) {
      if (distMatrix[k]) {
        // Average linkage
        const dA = distMatrix[nodeA.id][k] || 0;
        const dB = distMatrix[nodeB.id][k] || 0;
        const d = (dA * nodeA.size + dB * nodeB.size) / (nodeA.size + nodeB.size);
        distMatrix[newNode.id][k] = d;
        distMatrix[k][newNode.id] = d;
      }
    }

    nodes.splice(bestJ, 1);
    nodes.splice(bestI, 1);
    nodes.push(newNode);
  }

  return nodes[0];
}

export function getClustersFromDendrogram(root: DendrogramNode, k: number, n: number): number[] {
  const clusters: DendrogramNode[] = [root];
  while (clusters.length < k) {
    let bestIdx = -1;
    let maxDist = -1;
    for (let i = 0; i < clusters.length; i++) {
      if (clusters[i].left && clusters[i].distance > maxDist) {
        maxDist = clusters[i].distance;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;
    const node = clusters.splice(bestIdx, 1)[0];
    clusters.push(node.left!);
    clusters.push(node.right!);
  }

  const assignments = new Array(n).fill(-1);
  clusters.forEach((cluster, clusterId) => {
    const stack = [cluster];
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (node.pointIdx !== undefined) {
        assignments[node.pointIdx] = clusterId;
      }
      if (node.left) stack.push(node.left);
      if (node.right) stack.push(node.right);
    }
  });
  return assignments;
}

// Evaluation Metrics
export function calculateSilhouette(data: Point[], assignments: number[]): number {
  const n = data.length;
  if (n === 0) return 0;
  const dim = data[0].length;
  const numClusters = new Set(assignments.filter(a => a >= 0)).size;
  if (numClusters < 2) return 0;

  let totalS = 0;
  for (let i = 0; i < n; i++) {
    const clusterI = assignments[i];
    if (clusterI < 0) continue;

    // Calculate a(i)
    let a = 0;
    let countA = 0;
    for (let j = 0; j < n; j++) {
      if (i === j || assignments[j] !== clusterI) continue;
      let distSq = 0;
      for (let d = 0; d < dim; d++) {
        distSq += Math.pow(data[i][d] - data[j][d], 2);
      }
      a += Math.sqrt(distSq);
      countA++;
    }
    a = countA > 0 ? a / countA : 0;

    // Calculate b(i)
    let b = Infinity;
    for (let c = 0; c < numClusters; c++) {
      if (c === clusterI) continue;
      let distToC = 0;
      let countC = 0;
      for (let j = 0; j < n; j++) {
        if (assignments[j] !== c) continue;
        let distSq = 0;
        for (let d = 0; d < dim; d++) {
          distSq += Math.pow(data[i][d] - data[j][d], 2);
        }
        distToC += Math.sqrt(distSq);
        countC++;
      }
      if (countC > 0) {
        b = Math.min(b, distToC / countC);
      }
    }

    const s = (b - a) / Math.max(a, b);
    totalS += s;
  }
  return totalS / n;
}

export function calculateWCSS(data: Point[], assignments: number[], centroids: Point[]): number {
  let wcss = 0;
  if (data.length === 0) return 0;
  const dim = data[0].length;
  for (let i = 0; i < data.length; i++) {
    const cIdx = assignments[i];
    if (cIdx >= 0 && centroids[cIdx]) {
      let distSq = 0;
      for (let d = 0; d < dim; d++) {
        distSq += Math.pow(data[i][d] - centroids[cIdx][d], 2);
      }
      wcss += distSq;
    }
  }
  return wcss;
}

export function calculateDaviesBouldin(data: Point[], assignments: number[], centroids: Point[]): number {
  const k = centroids.length;
  if (k < 2 || data.length === 0) return 0;
  const dim = data[0].length;

  // Calculate average distance to centroid for each cluster (s_i)
  const s = new Array(k).fill(0);
  const counts = new Array(k).fill(0);
  
  for (let i = 0; i < data.length; i++) {
    const cIdx = assignments[i];
    if (cIdx >= 0 && centroids[cIdx]) {
      let distSq = 0;
      for (let d = 0; d < dim; d++) {
        distSq += Math.pow(data[i][d] - centroids[cIdx][d], 2);
      }
      s[cIdx] += Math.sqrt(distSq);
      counts[cIdx]++;
    }
  }

  for (let i = 0; i < k; i++) {
    if (counts[i] > 0) s[i] /= counts[i];
  }

  let dbIndex = 0;
  for (let i = 0; i < k; i++) {
    let maxRatio = -Infinity;
    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      let distSq = 0;
      for (let d = 0; d < dim; d++) {
        distSq += Math.pow(centroids[i][d] - centroids[j][d], 2);
      }
      const distCentroids = Math.sqrt(distSq);
      if (distCentroids > 0) {
        const ratio = (s[i] + s[j]) / distCentroids;
        if (ratio > maxRatio) maxRatio = ratio;
      }
    }
    if (maxRatio !== -Infinity) dbIndex += maxRatio;
  }

  return dbIndex / k;
}

export function meanShift(data: Point[], bandwidth: number, maxIter = 50): number[] {
  const n = data.length;
  const dim = data[0].length;
  const shiftedPoints: Point[] = data.map(p => [...p]);
  
  for (let iter = 0; iter < maxIter; iter++) {
    let maxShift = 0;
    for (let i = 0; i < n; i++) {
      const p = shiftedPoints[i];
      const sums = new Array(dim).fill(0);
      let totalWeight = 0;
      
      for (let j = 0; j < n; j++) {
        let distSq = 0;
        for (let d = 0; d < dim; d++) {
          distSq += Math.pow(p[d] - data[j][d], 2);
        }
        const dist = Math.sqrt(distSq);
        if (dist < bandwidth) {
          const weight = 1; // Flat kernel
          for (let d = 0; d < dim; d++) {
            sums[d] += data[j][d] * weight;
          }
          totalWeight += weight;
        }
      }
      
      if (totalWeight > 0) {
        const nextP = sums.map(s => s / totalWeight);
        let shiftSq = 0;
        for (let d = 0; d < dim; d++) {
          shiftSq += Math.pow(nextP[d] - p[d], 2);
        }
        const shift = Math.sqrt(shiftSq);
        maxShift = Math.max(maxShift, shift);
        shiftedPoints[i] = nextP;
      }
    }
    if (maxShift < 0.001) break;
  }

  // Cluster shifted points
  const assignments = new Array(n).fill(-1);
  const clusterCenters: Point[] = [];
  for (let i = 0; i < n; i++) {
    let found = false;
    for (let c = 0; c < clusterCenters.length; c++) {
      let distSq = 0;
      for (let d = 0; d < dim; d++) {
        distSq += Math.pow(shiftedPoints[i][d] - clusterCenters[c][d], 2);
      }
      if (Math.sqrt(distSq) < bandwidth / 2) {
        assignments[i] = c;
        found = true;
        break;
      }
    }
    if (!found) {
      assignments[i] = clusterCenters.length;
      clusterCenters.push(shiftedPoints[i]);
    }
  }
  return assignments;
}

