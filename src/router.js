const routes = {
  '/': { protected: false, title: 'Inicio' },
  '/login': { protected: false, title: 'Acceder' },
  '/demo': { protected: false, title: 'Demo del radar' },
  '/signals': { protected: false, title: 'Señales' },
  '/sources': { protected: false, title: 'Fuentes' },
  '/reader-model': { protected: false, title: 'Modelo lector' },
  '/operator': { protected: false, title: 'Modo operador' },
  '/radar': { protected: true, title: 'Radar privado' }
};

export function routeFor(pathname) {
  return routes[pathname] || routes['/'];
}

export function navigate(pathname) {
  window.location.hash = `#${pathname}`;
}

export function currentPath() {
  const path = window.location.hash.slice(1);
  return routes[path] ? path : '/';
}

export function isProtectedRoute(pathname) {
  return routeFor(pathname).protected;
}
