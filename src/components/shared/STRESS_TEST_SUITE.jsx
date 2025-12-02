// 🔥 SUBLINX STRESS TEST SUITE
// Automated stress testing for production readiness

import { base44 } from '@/api/base44Client';

/**
 * TESTE 1: Load Testing - Feed com 1000 eventos
 */
export async function stressTestFeed() {
  console.log('🔥 STRESS TEST: Feed Performance');
  
  const startTime = performance.now();
  const iterations = 10;
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const iterStart = performance.now();
    
    try {
      // Simular carregamento do feed
      const events = await base44.entities.Event.list('-date', 100);
      const iterEnd = performance.now();
      
      results.push({
        iteration: i + 1,
        duration: iterEnd - iterStart,
        eventsCount: events.length,
        success: true
      });
      
      console.log(`✅ Iteration ${i + 1}: ${(iterEnd - iterStart).toFixed(2)}ms`);
    } catch (error) {
      results.push({
        iteration: i + 1,
        duration: 0,
        eventsCount: 0,
        success: false,
        error: error.message
      });
      console.error(`❌ Iteration ${i + 1}: FAILED`, error);
    }
    
    // Delay entre iterações
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const endTime = performance.now();
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / iterations;
  const successRate = (results.filter(r => r.success).length / iterations) * 100;
  
  const report = {
    test: 'Feed Performance',
    totalDuration: endTime - startTime,
    iterations,
    averageDuration: avgDuration,
    successRate,
    results,
    passed: avgDuration < 500 && successRate === 100
  };
  
  console.log('\n📊 REPORT:');
  console.log(`Total: ${report.totalDuration.toFixed(2)}ms`);
  console.log(`Average: ${avgDuration.toFixed(2)}ms`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return report;
}

/**
 * TESTE 2: Concurrent Users - 100 usuários simultâneos
 */
export async function stressTestConcurrentUsers() {
  console.log('\n🔥 STRESS TEST: Concurrent Users');
  
  const userCount = 100;
  const promises = [];
  
  const startTime = performance.now();
  
  for (let i = 0; i < userCount; i++) {
    promises.push(
      (async () => {
        const start = performance.now();
        try {
          // Simular ações de usuário
          await Promise.all([
            base44.entities.Event.list('-date', 20),
            base44.entities.Reel.list('-created_date', 10),
          ]);
          const end = performance.now();
          return { success: true, duration: end - start };
        } catch (error) {
          const end = performance.now();
          return { success: false, duration: end - start, error: error.message };
        }
      })()
    );
  }
  
  const results = await Promise.all(promises);
  const endTime = performance.now();
  
  const successCount = results.filter(r => r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / userCount;
  const maxDuration = Math.max(...results.map(r => r.duration));
  
  const report = {
    test: 'Concurrent Users',
    totalDuration: endTime - startTime,
    userCount,
    successCount,
    failureCount: userCount - successCount,
    successRate: (successCount / userCount) * 100,
    averageDuration: avgDuration,
    maxDuration,
    passed: successCount === userCount && maxDuration < 2000
  };
  
  console.log('\n📊 REPORT:');
  console.log(`Total: ${report.totalDuration.toFixed(2)}ms`);
  console.log(`Success: ${successCount}/${userCount}`);
  console.log(`Average: ${avgDuration.toFixed(2)}ms`);
  console.log(`Max: ${maxDuration.toFixed(2)}ms`);
  console.log(`Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return report;
}

/**
 * TESTE 3: Memory Leak Detection
 */
export async function stressTestMemoryLeak() {
  console.log('\n🔥 STRESS TEST: Memory Leak Detection');
  
  if (!performance.memory) {
    console.warn('⚠️ performance.memory not available (Chrome only)');
    return { test: 'Memory Leak', skipped: true };
  }
  
  const iterations = 50;
  const measurements = [];
  
  for (let i = 0; i < iterations; i++) {
    // Força garbage collection se disponível
    if (window.gc) window.gc();
    
    const memBefore = performance.memory.usedJSHeapSize;
    
    // Simular operações que podem causar leak
    const events = await base44.entities.Event.list('-date', 100);
    const reels = await base44.entities.Reel.list('-created_date', 20);
    
    // Processar dados
    events.forEach(e => JSON.stringify(e));
    reels.forEach(r => JSON.stringify(r));
    
    const memAfter = performance.memory.usedJSHeapSize;
    
    measurements.push({
      iteration: i + 1,
      memoryBefore: memBefore,
      memoryAfter: memAfter,
      delta: memAfter - memBefore
    });
    
    if (i % 10 === 0) {
      console.log(`Iteration ${i + 1}: ${(memAfter / 1024 / 1024).toFixed(2)}MB`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  const avgMemoryIncrease = measurements.reduce((sum, m) => sum + m.delta, 0) / iterations;
  const totalMemoryIncrease = measurements[measurements.length - 1].memoryAfter - measurements[0].memoryBefore;
  
  const report = {
    test: 'Memory Leak Detection',
    iterations,
    averageIncrease: avgMemoryIncrease,
    totalIncrease: totalMemoryIncrease,
    finalMemory: measurements[measurements.length - 1].memoryAfter,
    passed: totalMemoryIncrease < 10 * 1024 * 1024 // < 10MB increase
  };
  
  console.log('\n📊 REPORT:');
  console.log(`Average Increase: ${(avgMemoryIncrease / 1024).toFixed(2)}KB`);
  console.log(`Total Increase: ${(totalMemoryIncrease / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Final Memory: ${(report.finalMemory / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return report;
}

/**
 * TESTE 4: Map Performance com 1000 eventos
 */
export async function stressTestMapPerformance() {
  console.log('\n🔥 STRESS TEST: Map Rendering Performance');
  
  // Criar 1000 eventos simulados
  const mockEvents = Array.from({ length: 1000 }, (_, i) => ({
    id: `event-${i}`,
    title: `Event ${i}`,
    location: {
      lat: -23.5505 + (Math.random() - 0.5) * 0.5,
      lng: -46.6333 + (Math.random() - 0.5) * 0.5
    },
    date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    genre: ['techno', 'house', 'trance'][Math.floor(Math.random() * 3)]
  }));
  
  const startTime = performance.now();
  
  // Simular processamento do mapa
  const markers = mockEvents.map(event => ({
    position: [event.location.lat, event.location.lng],
    eventId: event.id
  }));
  
  // Simular clustering
  const clustered = clusterMarkers(markers, 0.01);
  
  const endTime = performance.now();
  
  const report = {
    test: 'Map Performance',
    eventCount: mockEvents.length,
    markerCount: markers.length,
    clusterCount: clustered.length,
    processingTime: endTime - startTime,
    passed: (endTime - startTime) < 500
  };
  
  console.log('\n📊 REPORT:');
  console.log(`Events: ${report.eventCount}`);
  console.log(`Clusters: ${report.clusterCount}`);
  console.log(`Processing: ${report.processingTime.toFixed(2)}ms`);
  console.log(`Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return report;
}

/**
 * TESTE 5: Database Query Performance
 */
export async function stressTestDatabaseQueries() {
  console.log('\n🔥 STRESS TEST: Database Query Performance');
  
  const queries = [
    { name: 'List Events', fn: () => base44.entities.Event.list('-date', 100) },
    { name: 'Filter Events by Genre', fn: () => base44.entities.Event.filter({ genre: 'techno' }) },
    { name: 'List Reels', fn: () => base44.entities.Reel.list('-created_date', 20) },
    { name: 'List Likes', fn: () => base44.entities.Like.list('', 50) },
    { name: 'List Comments', fn: () => base44.entities.Comment.list('', 50) }
  ];
  
  const results = [];
  
  for (const query of queries) {
    const iterations = 5;
    const durations = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await query.fn();
        const end = performance.now();
        durations.push(end - start);
      } catch (error) {
        console.error(`❌ ${query.name} failed:`, error);
        durations.push(null);
      }
    }
    
    const validDurations = durations.filter(d => d !== null);
    const avg = validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length;
    
    results.push({
      query: query.name,
      iterations,
      successCount: validDurations.length,
      averageDuration: avg,
      passed: avg < 300
    });
    
    console.log(`${query.name}: ${avg.toFixed(2)}ms avg (${validDurations.length}/${iterations} success)`);
  }
  
  const allPassed = results.every(r => r.passed);
  
  const report = {
    test: 'Database Query Performance',
    queries: results,
    passed: allPassed
  };
  
  console.log(`\n📊 Overall: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return report;
}

/**
 * TESTE 6: Offline Functionality
 */
export async function stressTestOfflineFunctionality() {
  console.log('\n🔥 STRESS TEST: Offline Functionality');
  
  const results = [];
  
  // Verificar Service Worker
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    results.push({
      test: 'Service Worker Registered',
      passed: !!registration
    });
    console.log(registration ? '✅ Service Worker registered' : '❌ No Service Worker');
  } else {
    results.push({
      test: 'Service Worker Support',
      passed: false
    });
    console.log('❌ Service Worker not supported');
  }
  
  // Verificar Cache API
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    results.push({
      test: 'Cache API Available',
      passed: cacheNames.length > 0,
      cacheCount: cacheNames.length
    });
    console.log(cacheNames.length > 0 ? `✅ ${cacheNames.length} caches found` : '❌ No caches');
  }
  
  // Verificar IndexedDB
  const dbTest = await testIndexedDB();
  results.push({
    test: 'IndexedDB Available',
    passed: dbTest
  });
  console.log(dbTest ? '✅ IndexedDB working' : '❌ IndexedDB failed');
  
  const allPassed = results.every(r => r.passed);
  
  const report = {
    test: 'Offline Functionality',
    checks: results,
    passed: allPassed
  };
  
  console.log(`\n📊 Overall: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return report;
}

/**
 * SUITE COMPLETA - Executar todos os testes
 */
export async function runFullStressTestSuite() {
  console.log('\n🚀 STARTING FULL STRESS TEST SUITE\n');
  console.log('=' .repeat(50));
  
  const startTime = performance.now();
  
  const results = {
    feedPerformance: await stressTestFeed(),
    concurrentUsers: await stressTestConcurrentUsers(),
    memoryLeak: await stressTestMemoryLeak(),
    mapPerformance: await stressTestMapPerformance(),
    databaseQueries: await stressTestDatabaseQueries(),
    offlineFunctionality: await stressTestOfflineFunctionality()
  };
  
  const endTime = performance.now();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 STRESS TEST SUITE COMPLETED');
  console.log('='.repeat(50));
  console.log(`\nTotal Duration: ${((endTime - startTime) / 1000).toFixed(2)}s`);
  
  const allPassed = Object.values(results).every(r => r.passed || r.skipped);
  
  console.log(`\n${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`);
  
  return {
    passed: allPassed,
    duration: endTime - startTime,
    results
  };
}

// Helper functions
function clusterMarkers(markers, gridSize) {
  const clusters = [];
  const grid = new Map();
  
  markers.forEach(marker => {
    const gridX = Math.floor(marker.position[0] / gridSize);
    const gridY = Math.floor(marker.position[1] / gridSize);
    const key = `${gridX},${gridY}`;
    
    if (!grid.has(key)) {
      grid.set(key, []);
    }
    grid.get(key).push(marker);
  });
  
  grid.forEach((markers, key) => {
    if (markers.length > 1) {
      const avgLat = markers.reduce((sum, m) => sum + m.position[0], 0) / markers.length;
      const avgLng = markers.reduce((sum, m) => sum + m.position[1], 0) / markers.length;
      clusters.push({
        position: [avgLat, avgLng],
        count: markers.length,
        markers
      });
    } else {
      clusters.push(markers[0]);
    }
  });
  
  return clusters;
}

async function testIndexedDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open('test-db', 1);
    
    request.onerror = () => resolve(false);
    request.onsuccess = () => {
      request.result.close();
      indexedDB.deleteDatabase('test-db');
      resolve(true);
    };
  });
}

// Export para uso no console
if (typeof window !== 'undefined') {
  window.sublinxStressTests = {
    runFull: runFullStressTestSuite,
    feed: stressTestFeed,
    concurrent: stressTestConcurrentUsers,
    memory: stressTestMemoryLeak,
    map: stressTestMapPerformance,
    database: stressTestDatabaseQueries,
    offline: stressTestOfflineFunctionality
  };
  
  console.log('💡 Stress tests available:');
  console.log('  window.sublinxStressTests.runFull()');
  console.log('  window.sublinxStressTests.feed()');
  console.log('  window.sublinxStressTests.concurrent()');
  console.log('  window.sublinxStressTests.memory()');
  console.log('  window.sublinxStressTests.map()');
  console.log('  window.sublinxStressTests.database()');
  console.log('  window.sublinxStressTests.offline()');
}