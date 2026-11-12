export interface GenerarMapHtmlParams {
  latInicial: number;
  lngInicial: number;
  colectivosIniciales: any[];
  hitosIda: number[][];
  hitosRegreso: number[][];
}

export function generarMapHtml({
  latInicial,
  lngInicial,
  colectivosIniciales,
  hitosIda,
  hitosRegreso,
}: GenerarMapHtmlParams): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { -webkit-tap-highlight-color: transparent; }
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #0F172A;
          }
          .custom-tag {
            background-color: #16A34A;
            color: #FFFFFF;
            font-size: 11px;
            font-weight: bold;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 6px 10px;
            border-radius: 8px;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            white-space: nowrap;
            cursor: pointer;
            pointer-events: auto;
          }
          .tag-lleno { background-color: #DC2626 !important; }
          .tag-yo {
            background-color: #0284C7;
            color: #FFFFFF;
            font-size: 11px;
            font-weight: bold;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 5px 9px;
            border-radius: 8px;
            border: 2px solid #FFFFFF;
            box-shadow: 0 3px 6px rgba(0,0,0,0.4);
            white-space: nowrap;
          }
          .tag-partida {
            background-color: #059669;
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 800;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 5px 10px;
            border-radius: 20px;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 8px rgba(0,0,0,0.5);
            white-space: nowrap;
          }
          .tag-final {
            background-color: #DC2626;
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 800;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 5px 10px;
            border-radius: 20px;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 8px rgba(0,0,0,0.5);
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([${latInicial}, ${lngInicial}], 14);

          window.map = map;

          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

          var yoIcon = L.divIcon({
            className: 'div-yo',
            html: '<div class="tag-yo">📍 Mi Parada</div>',
            iconSize: [85, 26],
            iconAnchor: [42, 13]
          });
          L.marker([${latInicial}, ${lngInicial}], { icon: yoIcon }).addTo(map);

          var colectivoLayer = L.layerGroup().addTo(map);
          var paradasLayer = L.layerGroup().addTo(map);
          var polylineIda = null;
          var polylineRegreso = null;

          var waypointsIda = ${JSON.stringify(hitosIda)};
          var waypointsRegreso = ${JSON.stringify(hitosRegreso)};

          window.tocarColectivo = function(id) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ tipo: 'click_colectivo', id: String(id) }));
            }
          };

          function pedirRutaOSRM(puntos, color, callback) {
            var coordString = puntos.map(function(pt) { return pt[0] + ',' + pt[1]; }).join(';');
            var url = 'https://router.project-osrm.org/route/v1/driving/' + coordString + '?overview=full&geometries=geojson';
            fetch(url)
              .then(function(res) { return res.json(); })
              .then(function(data) {
                if (data.routes && data.routes.length > 0) {
                  var coords = data.routes[0].geometry.coordinates.map(function(c) {
                    return [c[1], c[0]];
                  });
                  var poly = L.polyline(coords, {
                    color: color,
                    weight: 6,
                    opacity: 0.9,
                    lineJoin: 'round',
                    lineCap: 'round'
                  }).addTo(map);
                  callback(poly);
                }
              })
              .catch(function(err) {
                console.log('Error OSRM:', err);
              });
          }

          window.actualizarTrazados = function(modo, mostrar) {
            if (polylineIda) { map.removeLayer(polylineIda); polylineIda = null; }
            if (polylineRegreso) { map.removeLayer(polylineRegreso); polylineRegreso = null; }
            paradasLayer.clearLayers();

            if (!mostrar) return;

            if (modo === 'ida' || modo === 'ambos') {
              pedirRutaOSRM(waypointsIda, '#00F0FF', function(poly) {
                polylineIda = poly;
                if (modo === 'ida') {
                  map.fitBounds(poly.getBounds(), { padding: [40, 40] });
                }
              });

              var iconoPartidaIda = L.divIcon({
                className: 'div-tag-p',
                html: '<div class="tag-partida">🟢 Salida: René Olivares</div>',
                iconSize: [160, 26],
                iconAnchor: [80, 13]
              });
              L.marker([-33.5385, -70.7853], { icon: iconoPartidaIda }).addTo(paradasLayer);

              var iconoFinIda = L.divIcon({
                className: 'div-tag-f',
                html: '<div class="tag-final">🏁 Fin Ida: Los Cancilleres</div>',
                iconSize: [165, 26],
                iconAnchor: [82, 13]
              });
              L.marker([-33.5065, -70.7185], { icon: iconoFinIda }).addTo(paradasLayer);
            }

            if (modo === 'regreso' || modo === 'ambos') {
              pedirRutaOSRM(waypointsRegreso, '#F59E0B', function(poly) {
                polylineRegreso = poly;
                if (modo === 'regreso') {
                  map.fitBounds(poly.getBounds(), { padding: [40, 40] });
                }
              });

              var iconoPartidaReg = L.divIcon({
                className: 'div-tag-p',
                html: '<div class="tag-partida">🟡 Salida: Los Cancilleres</div>',
                iconSize: [165, 26],
                iconAnchor: [82, 13]
              });
              L.marker([-33.5065, -70.7185], { icon: iconoPartidaReg }).addTo(paradasLayer);

              var iconoFinReg = L.divIcon({
                className: 'div-tag-f',
                html: '<div class="tag-final">🏁 Fin Vuelta: René Olivares</div>',
                iconSize: [170, 26],
                iconAnchor: [85, 13]
              });
              L.marker([-33.5385, -70.7853], { icon: iconoFinReg }).addTo(paradasLayer);
            }
          };

          window.actualizarMarcadores = function(colectivos) {
            colectivoLayer.clearLayers();
            colectivos.forEach(function(col) {
              var clase = col.cupos === 0 ? 'custom-tag tag-lleno' : 'custom-tag';
              var texto = '🚖 L-' + col.ruta + ' (' + (col.cupos > 0 ? col.cupos + ' lib' : 'Lleno') + ')';
              var htmlMarker = '<div class="' + clase + '" onclick="window.tocarColectivo(\\'' + col.id + '\\')">' + texto + '</div>';

              var icono = L.divIcon({
                className: 'div-col',
                html: htmlMarker,
                iconSize: [110, 32],
                iconAnchor: [55, 16]
              });

              var marker = L.marker([col.lat, col.lng], { icon: icono, interactive: true }).addTo(colectivoLayer);
              marker.on('click', function() {
                window.tocarColectivo(col.id);
              });
            });
          };

          actualizarMarcadores(${JSON.stringify(colectivosIniciales)});
          actualizarTrazados('ida', true);
        </script>
      </body>
    </html>
  `;
}

