
type Road = {
  from: string;
  to: string;
  distance: number;
};

const roads: Road[] = [
  { from: "Control Room", to: "Central Road", distance: 4 },
  { from: "Control Room", to: "Benz Circle", distance: 3 },
  { from: "Central Road", to: "City Bus Stop", distance: 6 },
  { from: "Central Road", to: "KL University", distance: 5 },
  { from: "Benz Circle", to: "City Bus Stop", distance: 4 },
  { from: "Benz Circle", to: "Hospital Gate", distance: 2 },
  { from: "Hospital Gate", to: "KL University", distance: 3 },
  { from: "KL University", to: "City Bus Stop", distance: 2 },
];

export function getShortestRoute(start: string, end: string) {
  const nodes = new Set<string>();

  roads.forEach((road) => {
    nodes.add(road.from);
    nodes.add(road.to);
  });

  const distance: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set(nodes);

  nodes.forEach((node) => {
    distance[node] = Infinity;
    previous[node] = null;
  });

  if (!nodes.has(start) || !nodes.has(end)) {
    return { path: [], distance: Infinity };
  }

  distance[start] = 0;

  while (unvisited.size > 0) {
    let current = "";
    let smallest = Infinity;

    unvisited.forEach((node) => {
      if (distance[node] < smallest) {
        smallest = distance[node];
        current = node;
      }
    });

    if (!current || smallest === Infinity) break;
    if (current === end) break;

    unvisited.delete(current);

    roads.forEach((road) => {
      let neighbor = "";

      if (road.from === current) neighbor = road.to;
      else if (road.to === current) neighbor = road.from;

      if (!neighbor || !unvisited.has(neighbor)) return;

      const newDistance = distance[current] + road.distance;

      if (newDistance < distance[neighbor]) {
        distance[neighbor] = newDistance;
        previous[neighbor] = current;
      }
    });
  }

  if (distance[end] === Infinity) {
    return { path: [], distance: Infinity };
  }

  const path: string[] = [];
  let current: string | null = end;

  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  return { path, distance: distance[end] };
}
