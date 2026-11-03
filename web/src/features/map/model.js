import { norm } from "../../shared/utils.js";

export const ll = (position) => [-position.z, position.x];

export const playerLayer = (position) =>
  position.y <= -50 ? "depths" : position.y >= 750 ? "sky" : "surface";

export const inLayer = (point, layer) =>
  layer === "depths"
    ? point.position.y <= -50
    : layer === "sky"
      ? point.position.y >= 750
      : point.position.y >= -50 && point.position.y <= 750;

export const coordinateString = (position) =>
  [position.x, -position.z, position.y - 105]
    .map((value) => {
      const n = Math.trunc(value);

      return (n < 0 ? "-" : "") + Math.abs(n).toString().padStart(4, "0");
    })
    .join("  ");

export const hasDiscoveryState = (point) =>
  point.category === "shrines" || point.category === "towers";

export function mapPointState(point, snapshot) {
  const state = snapshot?.states?.[point.index] ?? -1;

  if (state === 1) return "found";
  if (hasDiscoveryState(point) && snapshot?.visited?.[point.index] === 1)
    return "discovered";

  return state === 0 ? "missing" : "unknown";
}

export function shrineChestState(progress) {
  if (!progress?.total || progress.unknown) return "unknown";

  return progress.opened === progress.total ? "found" : "missing";
}

export function prepareMapCatalog(data) {
  const categories = Object.fromEntries(
    data.categories.map((category) => [category.id, category]),
  );
  const points = data.points.map((point, index) => {
    const route =
      point.path?.flowers?.map((flower) => flower.position) ||
      (point.path?.start && point.path?.end
        ? [point.path.start, point.path.end]
        : []);

    return {
      ...point,
      index,
      latLng: ll(point.position),
      searchText: norm(
        [
          point.name,
          point.korokType,
          point.internalName,
          categories[point.category].name,
        ].join(" "),
      ),
      routeCoordinates: route.map(ll),
    };
  });

  return { ...data, points };
}

export function filterMapPoints(
  points,
  { layer, active, snapshot, query = "", mode = "all" },
) {
  const search = norm(query.trim()),
    numeric = /^-?\d+[\s,;]+-?\d+(?:[\s,;]+-?\d+)?$/.test(search);

  return points.filter(
    (point) =>
      inLayer(point, layer) &&
      active.has(point.category) &&
      (!search || numeric || point.searchText.includes(search)) &&
      (mode === "all" ||
        (mode === "discovered"
          ? mapPointState(point, snapshot) === "discovered"
          : mode === "chests"
            ? point.category === "shrines" &&
              shrineChestState(snapshot?.shrineChests?.[point.index]) ===
                "missing"
            : (snapshot?.states[point.index] ?? -1) ===
              (mode === "missing" ? 0 : mode === "found" ? 1 : -1))),
  );
}

// Panning changes viewport bounds, but does not change the matching catalog points.
export function createMapPointFilter() {
  let previousPoints, previousSnapshot, previousKey, result;

  return (points, options) => {
    const { layer, active, snapshot, query = "", mode = "all" } = options;
    const key = JSON.stringify([layer, [...active], query, mode]);

    if (
      points !== previousPoints ||
      snapshot !== previousSnapshot ||
      key !== previousKey
    ) {
      result = filterMapPoints(points, options);
      previousPoints = points;
      previousSnapshot = snapshot;
      previousKey = key;
    }

    return result;
  };
}
