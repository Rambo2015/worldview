import OlPoint from 'ol/geom/Point';
import OlFeature from 'ol/Feature';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import {
  Style as OlStyle,
  Icon as OlIcon,
} from 'ol/style';
import * as olProj from 'ol/proj';
import { containsXY } from 'ol/extent';

export function animateCoordinates(map, coordinates, zoom) {
  const { ui } = map;
  const { proj } = ui.selected;
  let targetCoordinates = coordinates;
  if (proj !== 'geographic') {
    targetCoordinates = polarCoordinatesTransform(coordinates, proj);
  }
  ui.animate.fly(targetCoordinates, zoom);
}

export function polarCoordinatesTransform(coordinates, proj) {
  const projObj = {
    arctic: 'EPSG:3413',
    antarctic: 'EPSG:3031',
  };
  return olProj.transform(coordinates, 'EPSG:4326', projObj[proj]);
}

export function areCoordinatesWithinExtent(map, config, coordinates) {
  const { projections } = config;
  const { selected } = map.ui;
  const projMaxExtent = projections[selected.proj].maxExtent;

  let coordinatesWithinExtent;
  let transformedCoordinates;
  if (selected.proj !== 'geographic') {
    transformedCoordinates = polarCoordinatesTransform(coordinates, selected.proj);
    coordinatesWithinExtent = containsXY(projMaxExtent, transformedCoordinates[0], transformedCoordinates[1]);
  } else {
    coordinatesWithinExtent = containsXY(projMaxExtent, coordinates[0], coordinates[1]);
  }
  return {
    coordinatesWithinExtent,
    transformedCoordinates,
  };
}

export function addCoordinatesMarker(activeMarker, config, map, coordinates, reverseGeocodeResults) {
  const { selected } = map.ui;

  removeCoordinatesMarker(activeMarker, map);

  const { coordinatesWithinExtent, transformedCoordinates } = areCoordinatesWithinExtent(map, config, coordinates);
  if (!coordinatesWithinExtent) {
    return false;
  }

  const marker = createPin(coordinates, transformedCoordinates, reverseGeocodeResults);
  selected.addLayer(marker);
  selected.renderSync();
  return marker;
}

export function removeCoordinatesMarker(activeMarker, map) {
  const { selected, proj } = map.ui;
  // remove marker
  if (activeMarker) {
    activeMarker.setMap(null);
    selected.removeLayer(activeMarker);
  }
  // remove tooltip
  const removeOverlayFromAllProjections = () => {
    const mapProjections = Object.keys(proj);
    mapProjections.forEach((mapProjection) => {
      const mapOverlays = proj[mapProjection].getOverlays().getArray();
      const coordinatesTooltipOverlay = mapOverlays.filter((overlay) => {
        const { id } = overlay;
        return id && id.contains('coordinates-map-maker');
      });
      if (coordinatesTooltipOverlay.length > 0) {
        proj[mapProjection].removeOverlay(coordinatesTooltipOverlay[0]);
      }
    });
  };
  removeOverlayFromAllProjections();
}

const createPin = function(coordinates, transformedCoordinates = false, reverseGeocodeResults = {}) {
  const [longitude, latitude] = coordinates;
  const iconFeature = new OlFeature({
    geometry: new OlPoint(transformedCoordinates || coordinates),
    reverseGeocodeResults,
    latitude,
    longitude,
  });

  const iconStyle = new OlStyle({
    image: new OlIcon({
      anchorOrigin: 'bottom-left',
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      scale: 0.5,
      src: 'images/map-pin.png',
    }),
  });

  iconFeature.setStyle(iconStyle);
  iconFeature.setId('coordinates-map-maker');

  const vectorSource = new OlSourceVector({
    wrapX: false,
    features: [iconFeature],
  });
  const vectorLayer = new OlLayerVector({
    source: vectorSource,
  });

  return vectorLayer;
};

// ArcGIS World Geocoding Service API Requests and Options

const GEOCODE_OPTIONS = {
  urlBase: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/',
  requestOptions: {
    method: 'GET',
    redirect: 'follow',
  },
};

// https://developers.arcgis.com/rest/geocode/api-reference/geocoding-category-filtering.htm
// necessary to filter to remove fast food type suggestions, but still include relavant Places of Interest
const GEOCODE_SUGGEST_CATEGORIES = [
  'Address',
  'Populated Place',
  'Education,Land Features',
  'Water Features',
  'Museum',
  'Tourist Attraction',
  'Scientific Research',
  'Government Office',
  'Business Facility',
];

export async function suggest(val) {
  const { requestOptions, urlBase } = GEOCODE_OPTIONS;
  const encodedValue = encodeURIComponent(val);
  const encodedCategories = encodeURIComponent(GEOCODE_SUGGEST_CATEGORIES.join(','));

  try {
    const response = await fetch(`${urlBase}suggest?text=${encodedValue}&f=json&category=${encodedCategories}`, requestOptions);
    const result = await response.text();
    return JSON.parse(result);
  } catch (error) {
    return console.log('error', error);
  }
}

export async function processMagicKey(magicKey) {
  const { requestOptions, urlBase } = GEOCODE_OPTIONS;

  try {
    const response = await fetch(`${urlBase}findAddressCandidates?f=json&outFields=*&magicKey=${magicKey}=`, requestOptions);
    const result = await response.text();
    return JSON.parse(result);
  } catch (error) {
    return console.log('error', error);
  }
}

export async function reverseGeocode(coordinates) {
  const { requestOptions, urlBase } = GEOCODE_OPTIONS;

  try {
    const response = await fetch(`${urlBase}reverseGeocode?location=${coordinates}&f=json`, requestOptions);
    const result = await response.text();
    return JSON.parse(result);
  } catch (error) {
    return console.log('error', error);
  }
}