// src/data/rutasOficiales.ts

export interface PuntoCalle {
  orden: number;
  calle: string;
  comuna: string;
}

export interface RutaOficial {
  id: string;
  folio: string;
  linea: string;
  nombreEmpresa: string;
  comunas: string;
  terminal: string;
  centro: { lat: number; lng: number };
  zoom: number;
  trazadoIda: [number, number][];      // Esquinas calle a calle (Ida)
  trazadoRegreso: [number, number][];  // Esquinas calle a calle (Regreso)
  callesIda: PuntoCalle[];
  callesRegreso: PuntoCalle[];
}

export const RUTAS_SELECCIONADAS: RutaOficial[] = [
  // 1. LÍNEA 6023 (MAIPÚ - FOLIO 236023)
  {
    id: 'folio-236023',
    folio: '236023',
    linea: 'Línea 6023',
    nombreEmpresa: 'ETRUM SpA',
    comunas: 'Maipú',
    terminal: 'René Olivares ⇄ Los Cancilleres',
    centro: { lat: -33.5135, lng: -70.7550 },
    zoom: 13,
    // Trazado que dobla en cada esquina: René Olivares -> Hernán Olguín -> Silva Carvallo -> Éufrates -> Nueva San Martín -> Pajaritos -> 5 de Abril -> 1ª Transversal -> Av. Central -> Lumen -> Cancilleres
    trazadoIda: [
      [-33.5284, -70.7785], // René Olivares con 4 Poniente
      [-33.5262, -70.7745], // René Olivares con Hernán Olguín
      [-33.5245, -70.7725], // Hernán Olguín con Silva Carvallo
      [-33.5215, -70.7685], // Silva Carvallo con Río Éufrates
      [-33.5185, -70.7645], // Río Éufrates con Nueva San Martín
      [-33.5150, -70.7610], // Nueva San Martín con Portones
      [-33.5135, -70.7595], // Nueva San Martín con Av. Pajaritos
      [-33.5115, -70.7565], // Alberto Llona con Ricardo Ayala
      [-33.5105, -70.7550], // San José con El Carmen
      [-33.5098, -70.7535], // Carmen Luisa Correa con Manuel Rodríguez
      [-33.5090, -70.7515], // Av. 5 de Abril con Esquina Blanca
      [-33.5075, -70.7480], // Corregidor Zañartu con Irarrázaval
      [-33.5060, -70.7445], // 1ª Transversal con Av. Central
      [-33.5045, -70.7410], // Av. Central con 2ª Transversal
      [-33.5030, -70.7375], // 2ª Transversal con 3 Norte
      [-33.5020, -70.7345], // 3 Norte con Lumen
      [-33.5015, -70.7320], // Lumen con Los Cancilleres (Término Ida)
    ],
    // Regreso por calles: Cancilleres -> Lumen -> Alaska -> 2ª Transversal -> Vespucio -> 5 de Abril -> Rinconada -> El Olimpo -> Silva Carvallo -> 4 Poniente -> Garita
    trazadoRegreso: [
      [-33.5015, -70.7320], // Los Cancilleres
      [-33.5025, -70.7345], // Lumen con Alaska
      [-33.5035, -70.7380], // Alaska con 2ª Transversal
      [-33.5050, -70.7415], // 2ª Transversal con Rafael Riesco
      [-33.5075, -70.7445], // Av. Américo Vespucio con 2ª Transversal
      [-33.5085, -70.7480], // Av. Central con 1ª Transversal
      [-33.5100, -70.7525], // 1ª Transversal con Av. 5 de Abril
      [-33.5118, -70.7570], // Alberto Llona con Chacabuco
      [-33.5135, -70.7605], // San Martín con Camino a Rinconada
      [-33.5155, -70.7645], // Rinconada con Carmen
      [-33.5175, -70.7680], // Carmen con Av. Sur
      [-33.5190, -70.7710], // Av. Sur con El Olimpo
      [-33.5220, -70.7735], // El Olimpo con Silva Carvallo
      [-33.5245, -70.7760], // Silva Carvallo con Presidente González Videla
      [-33.5270, -70.7780], // González Videla con 4 Poniente
      [-33.5284, -70.7785], // 4 Poniente con René Olivares (Garita)
    ],
    callesIda: [
      { orden: 1, calle: 'RENE OLIVARES BECERRA', comuna: 'Maipú' },
      { orden: 2, calle: 'HERNAN OLGUIN', comuna: 'Maipú' },
      { orden: 3, calle: 'ALFREDO SILVA CARVALLO', comuna: 'Maipú' },
      { orden: 4, calle: 'RIO EUFRATES', comuna: 'Maipú' },
      { orden: 5, calle: 'NUEVA SAN MARTIN', comuna: 'Maipú' },
      { orden: 6, calle: 'AV. LOS PAJARITOS', comuna: 'Maipú' },
      { orden: 7, calle: 'ALBERTO LLONA', comuna: 'Maipú' },
      { orden: 8, calle: 'RICARDO AYALA', comuna: 'Maipú' },
      { orden: 9, calle: 'SAN JOSE', comuna: 'Maipú' },
      { orden: 10, calle: 'EL CARMEN', comuna: 'Maipú' },
      { orden: 11, calle: 'CARMEN LUISA CORREA', comuna: 'Maipú' },
      { orden: 12, calle: 'MANUEL RODRIGUEZ', comuna: 'Maipú' },
      { orden: 13, calle: 'AV. 5 DE ABRIL', comuna: 'Maipú' },
      { orden: 14, calle: 'AV. ESQUINA BLANCA', comuna: 'Maipú' },
      { orden: 15, calle: 'CORREGIDOR ZAÑARTU', comuna: 'Maipú' },
      { orden: 16, calle: 'JOSE MANUEL IRARRAZAVAL', comuna: 'Maipú' },
      { orden: 17, calle: '1ª TRANSVERSAL', comuna: 'Maipú' },
      { orden: 18, calle: 'AV. CENTRAL', comuna: 'Maipú' },
      { orden: 19, calle: '2ª TRANSVERSAL', comuna: 'Maipú' },
      { orden: 20, calle: '3 NORTE', comuna: 'Maipú' },
      { orden: 21, calle: 'LUMEN', comuna: 'Maipú' },
      { orden: 22, calle: 'LOS CANCILLERES', comuna: 'Maipú' },
    ],
    callesRegreso: [
      { orden: 23, calle: 'LOS CANCILLERES', comuna: 'Maipú' },
      { orden: 24, calle: 'LUMEN', comuna: 'Maipú' },
      { orden: 25, calle: 'ALASKA', comuna: 'Maipú' },
      { orden: 26, calle: '2ª TRANSVERSAL', comuna: 'Maipú' },
      { orden: 27, calle: 'RAFAEL RIESCO BERNALES', comuna: 'Maipú' },
      { orden: 28, calle: 'AV. AMERICO VESPUCIO', comuna: 'Maipú' },
      { orden: 29, calle: '2ª TRANSVERSAL', comuna: 'Maipú' },
      { orden: 30, calle: 'AV. CENTRAL', comuna: 'Maipú' },
      { orden: 31, calle: '1ª TRANSVERSAL', comuna: 'Maipú' },
      { orden: 32, calle: 'AV. 5 DE ABRIL', comuna: 'Maipú' },
      { orden: 33, calle: 'ALBERTO LLONA', comuna: 'Maipú' },
      { orden: 34, calle: 'CHACABUCO', comuna: 'Maipú' },
      { orden: 35, calle: 'SAN MARTIN', comuna: 'Maipú' },
      { orden: 36, calle: 'CAMINO A RINCONADA', comuna: 'Maipú' },
      { orden: 37, calle: 'CARMEN', comuna: 'Maipú' },
      { orden: 38, calle: 'AV. SUR', comuna: 'Maipú' },
      { orden: 39, calle: 'EL OLIMPO', comuna: 'Maipú' },
      { orden: 40, calle: 'ALFREDO SILVA CARVALLO', comuna: 'Maipú' },
      { orden: 41, calle: 'PRESIDENTE GABRIEL GONZALEZ VIDELA', comuna: 'Maipú' },
      { orden: 42, calle: '4 PONIENTE', comuna: 'Maipú' },
      { orden: 43, calle: 'RENE OLIVARES BECERRA', comuna: 'Maipú' },
    ],
  },

  // 2. LÍNEA 3009 (LA FLORIDA - FOLIO 233009)
  {
    id: 'folio-233009',
    folio: '233009',
    linea: 'Línea 3009',
    nombreEmpresa: 'Manutara Ltda.',
    comunas: 'La Florida',
    terminal: 'Pudeto ⇄ San Patricio',
    centro: { lat: -33.5280, lng: -70.5870 },
    zoom: 13,
    trazadoIda: [
      [-33.5152, -70.5985], // Pudeto con San Carlos de Ancud
      [-33.5170, -70.5960], // San Carlos de Ancud con Vicuña Mackenna
      [-33.5205, -70.5925], // Vicuña Mackenna con Vespucio
      [-33.5220, -70.5900], // Vespucio con Las Acacias
      [-33.5235, -70.5880], // Williams King con Santa Julia
      [-33.5255, -70.5865], // Santa Julia con Santa Raquel
      [-33.5275, -70.5845], // Santa Raquel con Sótero del Río
      [-33.5290, -70.5830], // Los Clarines con Las Gardenias
      [-33.5310, -70.5815], // Las Gardenias con Av. Trinidad
      [-33.5330, -70.5800], // Av. Trinidad con Av. 1
      [-33.5350, -70.5785], // José Miguel Carrera con Bahía Catalina
      [-33.5370, -70.5770], // Lapislázuli con Turquesa
      [-33.5390, -70.5760], // General Arriagada con Topacio
      [-33.5410, -70.5750], // Topacio con San Miguel / San Patricio
    ],
    trazadoRegreso: [
      [-33.5410, -70.5750], // San Patricio con María Elena
      [-33.5385, -70.5765], // María Elena con Bahía Catalina
      [-33.5360, -70.5780], // Bahía Catalina con Turquesa / Lapislázuli
      [-33.5340, -70.5795], // Esmeralda con Punta Arenas
      [-33.5320, -70.5810], // José Miguel Carrera con Av. 1
      [-33.5300, -70.5825], // Av. Trinidad con Las Gardenias
      [-33.5280, -70.5840], // Los Clarines con Sótero del Río
      [-33.5260, -70.5860], // Sótero del Río con Santa Raquel
      [-33.5240, -70.5885], // Santa Raquel con Santa Julia
      [-33.5225, -70.5905], // Williams King con Las Acacias
      [-33.5210, -70.5925], // Las Acacias con Vespucio
      [-33.5180, -70.5955], // Vespucio con Vicuña Mackenna
      [-33.5160, -70.5975], // San Carlos de Ancud con Pudeto
      [-33.5152, -70.5985], // Pudeto (Garita)
    ],
    callesIda: [
      { orden: 1, calle: 'PUDETO', comuna: 'La Florida' },
      { orden: 2, calle: 'SAN CARLOS DE ANCUD', comuna: 'La Florida' },
      { orden: 3, calle: 'AV. VICUÑA MACKENNA', comuna: 'La Florida' },
      { orden: 4, calle: 'AV. CIRCUNVALACION AMERICO VESPUCIO', comuna: 'La Florida' },
      { orden: 5, calle: 'LAS ACACIAS', comuna: 'La Florida' },
      { orden: 6, calle: 'WILLIAMS KING', comuna: 'La Florida' },
      { orden: 7, calle: 'SANTA JULIA', comuna: 'La Florida' },
      { orden: 8, calle: 'AV. SANTA RAQUEL', comuna: 'La Florida' },
      { orden: 9, calle: 'DOCTOR SOTERO DEL RIO', comuna: 'La Florida' },
      { orden: 10, calle: 'LOS CLARINES', comuna: 'La Florida' },
      { orden: 11, calle: 'LAS GARDENIAS', comuna: 'La Florida' },
      { orden: 12, calle: 'AV. TRINIDAD', comuna: 'La Florida' },
      { orden: 13, calle: 'AV. 1', comuna: 'La Florida' },
      { orden: 14, calle: 'JOSE MIGUEL CARRERA', comuna: 'La Florida' },
      { orden: 15, calle: 'BAHIA CATALINA', comuna: 'La Florida' },
      { orden: 16, calle: 'LAPISLAZULI', comuna: 'La Florida' },
      { orden: 17, calle: 'TURQUESA', comuna: 'La Florida' },
      { orden: 18, calle: 'GENERAL ARRIAGADA', comuna: 'La Florida' },
      { orden: 19, calle: 'TOPACIO', comuna: 'La Florida' },
      { orden: 20, calle: 'SAN MIGUEL', comuna: 'La Florida' },
    ],
    callesRegreso: [
      { orden: 21, calle: 'SAN PATRICIO', comuna: 'La Florida' },
      { orden: 22, calle: 'MARIA ELENA', comuna: 'La Florida' },
      { orden: 23, calle: 'BAHIA CATALINA', comuna: 'La Florida' },
      { orden: 24, calle: 'SAN MIGUEL', comuna: 'La Florida' },
      { orden: 25, calle: 'TURQUESA', comuna: 'La Florida' },
      { orden: 26, calle: 'LAPISLAZULI', comuna: 'La Florida' },
      { orden: 27, calle: 'ESMERALDA', comuna: 'La Florida' },
      { orden: 28, calle: 'PUNTA ARENAS', comuna: 'La Florida' },
      { orden: 29, calle: 'JOSE MIGUEL CARRERA', comuna: 'La Florida' },
      { orden: 30, calle: 'AV. 1', comuna: 'La Florida' },
      { orden: 31, calle: 'AV. TRINIDAD', comuna: 'La Florida' },
      { orden: 32, calle: 'LAS GARDENIAS', comuna: 'La Florida' },
      { orden: 33, calle: 'LOS CLARINES', comuna: 'La Florida' },
      { orden: 34, calle: 'DOCTOR SOTERO DEL RIO', comuna: 'La Florida' },
      { orden: 35, calle: 'AV. SANTA RAQUEL', comuna: 'La Florida' },
      { orden: 36, calle: 'SANTA JULIA', comuna: 'La Florida' },
      { orden: 37, calle: 'WILLIAMS KING', comuna: 'La Florida' },
      { orden: 38, calle: 'LAS ACACIAS', comuna: 'La Florida' },
      { orden: 39, calle: 'AV. CIRCUNVALACION AMERICO VESPUCIO', comuna: 'La Florida' },
      { orden: 40, calle: 'AV. VICUÑA MACKENNA', comuna: 'La Florida' },
      { orden: 41, calle: 'SAN CARLOS DE ANCUD', comuna: 'La Florida' },
      { orden: 42, calle: 'PUDETO', comuna: 'La Florida' },
    ],
  },

  // 3. LÍNEA 3031 (LA FLORIDA - FOLIO 233031)
  {
    id: 'folio-233031',
    folio: '233031',
    linea: 'Línea 3031',
    nombreEmpresa: 'Transportes Julio César S.A.',
    comunas: 'La Florida',
    terminal: 'Eje Julio César ⇄ Vicuña Mackenna Oriente',
    centro: { lat: -33.5290, lng: -70.5980 },
    zoom: 13,
    trazadoIda: [
      [-33.5450, -70.6050], // Eje Julio César / Rafael Matus
      [-33.5420, -70.6030], // Rafael Matus con Concordia
      [-33.5390, -70.6005], // Concordia con Guacolda
      [-33.5365, -70.5980], // Guacolda con Fraternidad
      [-33.5340, -70.5960], // Las Magnolias con Los Jazmines
      [-33.5320, -70.5945], // General Arriagada con Donizetti
      [-33.5295, -70.5935], // Donizetti con San José de la Estrella
      [-33.5270, -70.5925], // Aurora de Chile con Parinacota
      [-33.5245, -70.5920], // Parinacota con Av. Trinidad
      [-33.5225, -70.5930], // Av. Trinidad con Santa Raquel
      [-33.5205, -70.5950], // Santa Raquel con Circunvalación Vespucio
      [-33.5180, -70.5980], // Vespucio con Vicuña Mackenna Oriente
    ],
    trazadoRegreso: [
      [-33.5180, -70.5980], // Vicuña Mackenna Oriente
      [-33.5195, -70.5975], // Paso El Roble con Vicuña Mackenna Poniente
      [-33.5215, -70.5940], // Vespucio con Santa Julia
      [-33.5235, -70.5925], // Santa Julia con Santa Raquel
      [-33.5255, -70.5922], // Santa Raquel con Av. Trinidad
      [-33.5280, -70.5930], // Trinidad con Parinacota
      [-33.5305, -70.5940], // Parinacota con Aurora de Chile
      [-33.5330, -70.5955], // San José de la Estrella con Donizetti
      [-33.5350, -70.5970], // General Arriagada con Los Jazmines
      [-33.5375, -70.5990], // Las Magnolias con Fraternidad
      [-33.5400, -70.6015], // Fraternidad con Guacolda
      [-33.5425, -70.6035], // Concordia con Rafael Matus
      [-33.5450, -70.6050], // Rafael Matus con Miguel Mujica (Garita)
    ],
    callesIda: [
      { orden: 1, calle: 'MIGUEL MUJICA (EJE JULIO CESAR)', comuna: 'La Florida' },
      { orden: 2, calle: 'RAFAEL MATUS', comuna: 'La Florida' },
      { orden: 3, calle: 'CONCORDIA', comuna: 'La Florida' },
      { orden: 4, calle: 'GUACOLDA', comuna: 'La Florida' },
      { orden: 5, calle: 'FRATERNIDAD', comuna: 'La Florida' },
      { orden: 6, calle: 'LAS MAGNOLIAS', comuna: 'La Florida' },
      { orden: 7, calle: 'LOS JAZMINES', comuna: 'La Florida' },
      { orden: 8, calle: 'GENERAL ARRIAGADA', comuna: 'La Florida' },
      { orden: 9, calle: 'DONIZETTI', comuna: 'La Florida' },
      { orden: 10, calle: 'SAN JOSE DE LA ESTRELLA', comuna: 'La Florida' },
      { orden: 11, calle: 'AURORA DE CHILE', comuna: 'La Florida' },
      { orden: 12, calle: 'PARINACOTA', comuna: 'La Florida' },
      { orden: 13, calle: 'AV. TRINIDAD', comuna: 'La Florida' },
      { orden: 14, calle: 'AV. SANTA RAQUEL', comuna: 'La Florida' },
      { orden: 15, calle: 'AV. CIRCUNVALACION AMERICO VESPUCIO', comuna: 'La Florida' },
      { orden: 16, calle: 'AV. VICUÑA MACKENNA ORIENTE', comuna: 'La Florida' },
    ],
    callesRegreso: [
      { orden: 17, calle: 'AV. VICUÑA MACKENNA ORIENTE', comuna: 'La Florida' },
      { orden: 18, calle: 'PASO EL ROBLE', comuna: 'La Florida' },
      { orden: 19, calle: 'AV. VICUÑA MACKENNA PONIENTE', comuna: 'La Florida' },
      { orden: 20, calle: 'AV. CIRCUNVALACION AMERICO VESPUCIO', comuna: 'La Florida' },
      { orden: 21, calle: 'SANTA JULIA', comuna: 'La Florida' },
      { orden: 22, calle: 'AV. SANTA RAQUEL', comuna: 'La Florida' },
      { orden: 23, calle: 'AV. TRINIDAD', comuna: 'La Florida' },
      { orden: 24, calle: 'PARINACOTA', comuna: 'La Florida' },
      { orden: 25, calle: 'AURORA DE CHILE', comuna: 'La Florida' },
      { orden: 26, calle: 'SAN JOSE DE LA ESTRELLA', comuna: 'La Florida' },
      { orden: 27, calle: 'DONIZETTI', comuna: 'La Florida' },
      { orden: 28, calle: 'GENERAL ARRIAGADA', comuna: 'La Florida' },
      { orden: 29, calle: 'LOS JAZMINES', comuna: 'La Florida' },
      { orden: 30, calle: 'LAS MAGNOLIAS', comuna: 'La Florida' },
      { orden: 31, calle: 'FRATERNIDAD', comuna: 'La Florida' },
      { orden: 32, calle: 'GUACOLDA', comuna: 'La Florida' },
      { orden: 33, calle: 'CONCORDIA', comuna: 'La Florida' },
      { orden: 34, calle: 'RAFAEL MATUS', comuna: 'La Florida' },
      { orden: 35, calle: 'MIGUEL MUJICA (EJE JULIO CESAR)', comuna: 'La Florida' },
    ],
  },

  // 4. LÍNEA 4010 (SAN JOSÉ DE MAIPO / PUENTE ALTO - FOLIO 234010)
  {
    id: 'folio-234010',
    folio: '234010',
    linea: 'Línea 4010',
    nombreEmpresa: 'Cóndor del Maipo Ltda.',
    comunas: 'San José de Maipo / Puente Alto',
    terminal: 'San Gabriel ⇄ Metro Plaza de Puente Alto',
    centro: { lat: -33.6450, lng: -70.4300 },
    zoom: 11,
    // Sigue la curva de Camino El Volcán y el ingreso urbano por Eyzaguirre / Concha y Toro
    trazadoIda: [
      [-33.7850, -70.2450], // Camino El Volcán (San Gabriel)
      [-33.7550, -70.2800], // Camino El Volcán (La Obra)
      [-33.7310, -70.3200], // San Alfonso
      [-33.6800, -70.3500], // El Manzano
      [-33.6420, -70.3645], // San José de Maipo Centro
      [-33.6200, -70.4400], // La Obra Cordillera
      [-33.6080, -70.5250], // Las Vizcachas con Eyzaguirre
      [-33.6100, -70.5450], // Eyzaguirre con Nemesio Vicuña
      [-33.6110, -70.5580], // Nemesio Vicuña con Manuel Rodríguez
      [-33.6115, -70.5650], // Santa Elena con Domingo Tocornal
      [-33.6120, -70.5720], // Domingo Tocornal con Av. Concha y Toro
      [-33.6125, -70.5765], // Metro Plaza Puente Alto / Independencia
    ],
    trazadoRegreso: [
      [-33.6125, -70.5765], // Concha y Toro (Metro Plaza Puente Alto)
      [-33.6135, -70.5750], // Gandarillas con Santo Domingo
      [-33.6115, -70.5550], // Santo Domingo con Eyzaguirre
      [-33.6085, -70.5250], // Eyzaguirre con Las Vizcachas
      [-33.6200, -70.4400], // Camino El Volcán
      [-33.6420, -70.3645], // San José de Maipo Centro
      [-33.6800, -70.3500], // El Manzano
      [-33.7310, -70.3200], // San Alfonso
      [-33.7550, -70.2800], // El Volcán
      [-33.7850, -70.2450], // San Gabriel (Terminal)
    ],
    callesIda: [
      { orden: 1, calle: 'CAMINO EL VOLCAN', comuna: 'San José de Maipo' },
      { orden: 2, calle: 'CAMINO EL VOLCAN (SAN ALFONSO)', comuna: 'San José de Maipo' },
      { orden: 3, calle: 'RETORNO CAMINO EL VOLCAN (SAN ALFONSO)', comuna: 'San José de Maipo' },
      { orden: 4, calle: 'CAMINO EL VOLCAN', comuna: 'San José de Maipo' },
      { orden: 5, calle: 'CAMINO EL VOLCAN', comuna: 'San José de Maipo' },
      { orden: 6, calle: 'EYZAGUIRRE', comuna: 'Puente Alto' },
      { orden: 7, calle: 'NEMESIO VICUÑA', comuna: 'Puente Alto' },
      { orden: 8, calle: 'AV. MANUEL RODRIGUEZ', comuna: 'Puente Alto' },
      { orden: 9, calle: 'SANTA ELENA', comuna: 'Puente Alto' },
      { orden: 10, calle: 'DOMINGO TOCORNAL', comuna: 'Puente Alto' },
      { orden: 11, calle: 'AV. CONCHA Y TORO', comuna: 'Puente Alto' },
      { orden: 12, calle: 'SAN CARLOS', comuna: 'Puente Alto' },
      { orden: 13, calle: 'AV. CONCHA Y TORO', comuna: 'Puente Alto' },
      { orden: 14, calle: 'INDEPENDENCIA', comuna: 'Puente Alto' },
    ],
    callesRegreso: [
      { orden: 15, calle: 'AV. CONCHA Y TORO', comuna: 'Puente Alto' },
      { orden: 16, calle: 'GANDARILLAS', comuna: 'Puente Alto' },
      { orden: 17, calle: 'SANTO DOMINGO', comuna: 'Puente Alto' },
      { orden: 18, calle: 'EYZAGUIRRE', comuna: 'Puente Alto' },
      { orden: 19, calle: 'CAMINO EL VOLCAN', comuna: 'San José de Maipo' },
      { orden: 20, calle: 'CAMINO EL VOLCAN', comuna: 'San José de Maipo' },
      { orden: 21, calle: 'CAMINO EL VOLCAN (SAN ALFONSO)', comuna: 'San José de Maipo' },
      { orden: 22, calle: 'CAMINO EL VOLCAN (SAN GABRIEL)', comuna: 'San José de Maipo' },
      { orden: 23, calle: 'RETORNO CAMINO EL VOLCAN (SAN GABRIEL)', comuna: 'San José de Maipo' },
      { orden: 24, calle: 'CAMINO EL VOLCAN (SAN ALFONSO)', comuna: 'San José de Maipo' },
      { orden: 25, calle: 'CAMINO EL VOLCAN', comuna: 'San José de Maipo' },
    ],
  },

  // 5. LÍNEA 4032 (PUENTE ALTO - FOLIO 234032)
  {
    id: 'folio-234032',
    folio: '234032',
    linea: 'Línea 4032',
    nombreEmpresa: 'Renacer S.A.',
    comunas: 'Puente Alto',
    terminal: 'Ángel Pimentel ⇄ Balmaceda',
    centro: { lat: -33.6060, lng: -70.5700 },
    zoom: 14,
    trazadoIda: [
      [-33.5950, -70.5630], // Ángel Pimentel con Nonato Coo
      [-33.5975, -70.5650], // Nonato Coo con San Hugo
      [-33.6000, -70.5680], // San Hugo con Nemesio Vicuña
      [-33.6030, -70.5710], // Nemesio Vicuña con Las Nieves Oriente
      [-33.6060, -70.5735], // Las Nieves Oriente con Av. Concha y Toro
      [-33.6095, -70.5755], // Av. Concha y Toro con José Luis Coo
      [-33.6120, -70.5770], // Plaza Puente Alto
    ],
    trazadoRegreso: [
      [-33.6140, -70.5780], // Balmaceda con Dr. Eduardo Cordero
      [-33.6110, -70.5765], // Eduardo Cordero con Av. Concha y Toro
      [-33.6080, -70.5750], // Concha y Toro con San Carlos
      [-33.6050, -70.5725], // San Carlos con Las Nieves Oriente
      [-33.6015, -70.5695], // Las Nieves Oriente con Nemesio Vicuña
      [-33.5985, -70.5665], // Nemesio Vicuña con San Hugo
      [-33.5960, -70.5645], // San Hugo con Nonato Coo
      [-33.5950, -70.5630], // Nonato Coo con Ángel Pimentel (Garita)
    ],
    callesIda: [
      { orden: 1, calle: 'ANGEL PIMENTEL', comuna: 'Puente Alto' },
      { orden: 2, calle: 'NONATO COO', comuna: 'Puente Alto' },
      { orden: 3, calle: 'SAN HUGO', comuna: 'Puente Alto' },
      { orden: 4, calle: 'NEMESIO VICUÑA', comuna: 'Puente Alto' },
      { orden: 5, calle: 'LAS NIEVES ORIENTE', comuna: 'Puente Alto' },
      { orden: 6, calle: 'AV. CONCHA Y TORO', comuna: 'Puente Alto' },
      { orden: 7, calle: 'JOSE LUIS COO', comuna: 'Puente Alto' },
    ],
    callesRegreso: [
      { orden: 8, calle: 'BALMACEDA', comuna: 'Puente Alto' },
      { orden: 9, calle: 'DOCTOR EDUARDO CORDERO', comuna: 'Puente Alto' },
      { orden: 10, calle: 'AV. CONCHA Y TORO', comuna: 'Puente Alto' },
      { orden: 11, calle: 'SAN CARLOS', comuna: 'Puente Alto' },
      { orden: 12, calle: 'LAS NIEVES ORIENTE', comuna: 'Puente Alto' },
      { orden: 13, calle: 'NEMESIO VICUÑA', comuna: 'Puente Alto' },
      { orden: 14, calle: 'SAN HUGO', comuna: 'Puente Alto' },
      { orden: 15, calle: 'NONATO COO', comuna: 'Puente Alto' },
      { orden: 16, calle: 'ANGEL PIMENTEL', comuna: 'Puente Alto' },
    ],
  },
];