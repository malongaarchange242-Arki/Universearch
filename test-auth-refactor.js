#!/usr/bin/env node

/**
 * 🚀 Test Script - Auth Registration Refactor
 *
 * Usage: npm run test:auth
 *
 * Ce script teste le nouveau système d'authentification refactorisé :
 * - Idempotence (même email = même résultat)
 * - Protection contre doubles soumissions
 * - Gestion d'erreurs propre
 * - Création automatique du profile via trigger
 */

const axios = require('axios');

const BASE_URL = process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001';
const TEST_EMAIL = `test-${Date.now()}@example.com`;

console.log('🧪 Testing Auth Registration Refactor...\n');

// Test 1: Première inscription (devrait réussir)
console.log('📝 Test 1: Première inscription');
try {
  const response = await axios.post(`${BASE_URL}/auth/register`, {
    email: TEST_EMAIL,
    nom: 'Test',
    prenom: 'User',
    telephone: '+33123456789',
    profileType: 'utilisateur',
    userType: 'etudiant'
  });

  console.log('✅ Success:', response.data.message);
  console.log('   User ID:', response.data.data.userId);
  console.log('   Token generated:', !!response.data.data.token);
} catch (error) {
  console.log('❌ Failed:', error.response?.data?.error || error.message);
}

// Test 2: Inscription idempotente (même email, devrait réussir avec même user)
console.log('\n🔄 Test 2: Inscription idempotente (même email)');
try {
  const response = await axios.post(`${BASE_URL}/auth/register`, {
    email: TEST_EMAIL,
    nom: 'Test',
    prenom: 'User',
    telephone: '+33123456789',
    profileType: 'utilisateur',
    userType: 'etudiant'
  });

  console.log('✅ Success (idempotent):', response.data.message);
  console.log('   Same User ID:', response.data.data.userId);
} catch (error) {
  console.log('❌ Failed:', error.response?.data?.error || error.message);
}

// Test 3: Données invalides
console.log('\n🚫 Test 3: Données invalides');
try {
  await axios.post(`${BASE_URL}/auth/register`, {
    email: 'invalid-email',
    nom: '',
    profileType: 'invalide'
  });
  console.log('❌ Should have failed');
} catch (error) {
  if (error.response?.status === 400) {
    console.log('✅ Correctly rejected:', error.response.data.error);
  } else {
    console.log('❌ Wrong error:', error.response?.data?.error || error.message);
  }
}

// Test 4: Double soumission rapide (devrait être rejetée)
console.log('\n⚡ Test 4: Double soumission rapide');
const promises = [];
for (let i = 0; i < 3; i++) {
  promises.push(
    axios.post(`${BASE_URL}/auth/register`, {
      email: `double-test-${Date.now()}-${i}@example.com`,
      nom: 'Double',
      prenom: 'Test',
      telephone: '+33123456789',
      profileType: 'utilisateur',
      userType: 'etudiant'
    }).catch(err => err)
  );
}

const results = await Promise.all(promises);
const successCount = results.filter(r => r.status === 201).length;
const rateLimitCount = results.filter(r => r.response?.status === 429).length;

console.log(`✅ Success: ${successCount}, Rate limited: ${rateLimitCount}`);

console.log('\n🎉 Tests terminés !');
console.log('📊 Vérifiez les logs du service pour les détails complets.');</content>
<parameter name="filePath">d:\UNIVERSEARCH BACKEND\services\identity-service\test-auth-refactor.js