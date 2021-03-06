import 'leaflet-draw';
import 'leaflet.markercluster';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';

import L from 'leaflet';
import config from '../../utils/config';

// workaround for webpack messing up asset urls
// https://github.com/PaulLeCam/react-leaflet/issues/255#issuecomment-269750542
// https://github.com/Leaflet/Leaflet/issues/4968
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const { mapboxToken } = config;

export default class Map {
  constructor(latColumn, lngColumn) {
    this.latColumn = latColumn;
    this.lngColumn = lngColumn;
    this.markers = [];
  }

  /**
   * @param mapId the id of the the div container for the map
   */
  init(mapId) {
    this.map = L.map(mapId, {
      center: [0, 0],
      zoom: 1,
      closePopupOnClick: false,
      maxBoundsViscocity: 0.5,
    });

    // fill screen with map, roughly 360 degrees of longitude
    const z = this.map.getBoundsZoom([[90, -180], [-90, 180]], true);
    this.map.setZoom(z);

    this.mapTiles = L.tileLayer(
      'https://api.mapbox.com/v4/mapbox.outdoors/{z}/{x}/{y}.png?access_token={access_token}',
      { access_token: mapboxToken },
    );

    this.mapTiles.addTo(this.map);
    this.base = this.mapTiles;

    this.satelliteTiles = L.tileLayer(
      'https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token={access_token}',
      { access_token: mapboxToken },
    );

    this.usgsTiles = L.tileLayer.wms(
      'https://basemap.nationalmap.gov/arcgis/services/USGSImageryOnly/MapServer/WMSServer',
      { layers: 0, maxZoom: 8 },
    );

    this.clusterLayer = new L.MarkerClusterGroup({ chunkedLoading: true });
  }

  /**
   *
   * @param data data is a json array of objects. Each object should contain a key matching the given latColumn
   * & lngColumn
   * @param popupContentCallback the function to call to populate the popup box content. Will be passed the current resource
   */
  setMarkers(data, popupContentCallback) {
    this._clearMap();

    data.forEach(resource => {
      const lat = resource[this.latColumn];
      const lng = L.Util.wrapNum(resource[this.lngColumn], [0, 360], true); // center on pacific ocean

      if (isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng]);

      if (typeof popupContentCallback === 'function') {
        marker.bindPopup(popupContentCallback(resource));
      }

      this.markers.push(marker);
    });

    this.clusterLayer.addLayers(this.markers);

    this.map.addLayer(this.clusterLayer).setMinZoom(1);

    if (this.markers.length > 0) {
      this.map.fitBounds(this.clusterLayer.getBounds(), {
        padding: [30, 30],
      });
    }

    this.map.on('move', this._updateMarkerLocations.bind(this));

    this.map.on('dragstart', () => {
      const centerLng = this.map.getCenter().lng;
      // the following is how leaflet internally calculates the max bounds. Leaflet doesn't provide a way
      // to bound only the latitude, so we do that here. We set the lng to be bound 3x greater the the center
      // and is recalculated upon every dragstart event, which should essentially keep the lng unbound
      const nwCorner = [90, centerLng - 1080];
      const seCorner = [-90, centerLng + 1080];

      this.map.setMaxBounds([nwCorner, seCorner]);
    });
  }

  satelliteView() {
    this.map.removeLayer(this.base);
    this.map.addLayer(this.satelliteTiles);
    this.base = this.satelliteTiles;
  }

  mapView() {
    this.map.removeLayer(this.base);
    this.map.addLayer(this.mapTiles);
    this.base = this.mapTiles;
  }

  usgsView() {
    this.map.removeLayer(this.base);
    this.map.addLayer(this.usgsTiles);
    this.base = this.usgsTiles;
  }

  drawBounds(createCallback) {
    // leaflet-draw only attaches to global L, not sure how to import directly
    new L.Draw.Rectangle(this.map, {}).enable();

    this.map.on(L.Draw.Event.CREATED, e => {
      this.boundingBox = e.layer;
      this.map.addLayer(this.boundingBox);
      const ne = e.layer
        .getBounds()
        .getNorthEast()
        .wrap();
      const sw = e.layer
        .getBounds()
        .getSouthWest()
        .wrap();

      createCallback({
        northEast: ne,
        southWest: sw,
      });
    });

    this.map.on(L.Draw.Event.DRAWSTOP, () => {
      if (!this.boundingBox) {
        this.map.off(L.Draw.Event.CREATED);
        createCallback();
      }
      this.map.off(L.Draw.Event.DRAWSTOP);
    });
  }

  clearBounds() {
    if (this.boundingBox) {
      this.map.removeLayer(this.boundingBox);
      this.map.off(L.Draw.Event.CREATED);
      this.boundingBox = null;
    }
  }

  /**
   * calls map.invalidateSize(). Used to recalculate the map size if the container has changed dimensions
   */
  refreshSize() {
    this.map.invalidateSize();
  }

  _clearMap() {
    if (this.clusterLayer && this.markers.length > 0) {
      this.clusterLayer.clearLayers();
    }
    this.markers = [];
  }

  /**
   * move the markers as the user pans the map. Otherwise, the markers will be panned out of view
   */
  _updateMarkerLocations() {
    const centerLng = this.map.getCenter().lng;
    const updatedMarkers = [];
    const originalMarkers = [];
    this.clusterLayer.eachLayer(m => {
      const latlng = m.getLatLng();
      if (latlng.lng < centerLng) {
        // marker is W of center
        if (centerLng - 180 > latlng.lng) {
          const mCopy = L.marker([latlng.lat, latlng.lng + 360]);
          mCopy.bindPopup(m.getPopup());
          updatedMarkers.push(mCopy);
          originalMarkers.push(m);
        }
        // marker is E of center
      } else if (centerLng + 180 < latlng.lng) {
        const mCopy = L.marker([latlng.lat, latlng.lng - 360]);
        mCopy.bindPopup(m.getPopup());
        updatedMarkers.push(mCopy);
        originalMarkers.push(m);
      }
    });
    this.clusterLayer.removeLayers(originalMarkers);
    this.clusterLayer.addLayers(updatedMarkers);
  }
}
