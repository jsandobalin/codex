import test from 'node:test';
import assert from 'node:assert/strict';
import { isProtectedRoute, routeFor } from '../src/router.js';

test('the radar route is protected', () => {
  assert.equal(isProtectedRoute('/radar'), true);
});

test('demo modules resolve as public routes', () => {
  assert.equal(routeFor('/signals').title, 'Señales');
  assert.equal(routeFor('/operator').protected, false);
});

test('public and unknown routes resolve safely', () => {
  assert.equal(isProtectedRoute('/login'), false);
  assert.equal(routeFor('/unknown').title, 'Inicio');
});
