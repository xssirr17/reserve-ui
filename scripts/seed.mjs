#!/usr/bin/env node

/**
 * Standalone Seed Script for Reserve Service.
 * Populates sample generic resources (room, provider, class) and future slots.
 *
 * Usage:
 *   node scripts/seed.mjs [targetUrl]
 *   Default targetUrl: http://localhost:8080
 */

const targetUrl = process.argv[2] || process.env.VITE_API_TARGET || 'http://localhost:8080';

async function request(path, options = {}) {
  const url = `${targetUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    throw new Error(
      `Request failed [${res.status} ${res.statusText}] ${url}: ${
        typeof body === 'object' ? JSON.stringify(body) : body
      }`
    );
  }
  return body;
}

function getTomorrowDate(hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

async function main() {
  console.log(`\n🌱 Seeding demo data against ${targetUrl}...`);

  // Verify backend health
  try {
    const health = await request('/actuator/health');
    console.log(`Backend status: ${health.status}`);
  } catch (err) {
    console.error(`❌ Could not connect to backend at ${targetUrl}:`, err.message);
    process.exit(1);
  }

  // 1. Create Resources
  const sampleResources = [
    {
      name: 'Executive Boardroom Alpha',
      type: 'ROOM',
      metadata: {
        capacity: 12,
        floor: 4,
        features: ['4K Display', 'Video Conferencing', 'Whiteboard'],
        requiresKeycard: true,
      },
      slots: [
        { startTime: getTomorrowDate(9, 0), endTime: getTomorrowDate(10, 0), capacity: 1 },
        { startTime: getTomorrowDate(10, 30), endTime: getTomorrowDate(11, 30), capacity: 1 },
        { startTime: getTomorrowDate(14, 0), endTime: getTomorrowDate(15, 0), capacity: 1 },
      ],
    },
    {
      name: 'Advisory Consultant - Jordan',
      type: 'SERVICE_PROVIDER',
      metadata: {
        department: 'Architecture & Strategy',
        location: 'Virtual / Remote',
        languages: ['English', 'German'],
        active: true,
      },
      slots: [
        { startTime: getTomorrowDate(11, 0), endTime: getTomorrowDate(12, 0), capacity: 1 },
        { startTime: getTomorrowDate(13, 0), endTime: getTomorrowDate(14, 0), capacity: 1 },
        { startTime: getTomorrowDate(15, 30), endTime: getTomorrowDate(16, 30), capacity: 1 },
      ],
    },
    {
      name: 'Studio Masterclass: High Performance Systems',
      type: 'WORKSHOP_CLASS',
      metadata: {
        maxCapacity: 20,
        level: 'Intermediate to Advanced',
        prerequisites: ['Distributed Systems Basics'],
        materialsProvided: true,
      },
      slots: [
        { startTime: getTomorrowDate(16, 0), endTime: getTomorrowDate(17, 30), capacity: 20 },
        { startTime: getTomorrowDate(18, 0), endTime: getTomorrowDate(19, 30), capacity: 20 },
      ],
    },
  ];

  for (const sample of sampleResources) {
    console.log(`\nCreating resource "${sample.name}" [${sample.type}]...`);
    const resource = await request('/api/resources', {
      method: 'POST',
      body: JSON.stringify({
        name: sample.name,
        type: sample.type,
        metadata: sample.metadata,
      }),
    });
    console.log(`  ✓ Resource ID: ${resource.id}`);

    for (const slot of sample.slots) {
      try {
        const createdSlot = await request(`/api/resources/${resource.id}/slots`, {
          method: 'POST',
          body: JSON.stringify(slot),
        });
        console.log(
          `  ✓ Slot: ${createdSlot.startTime} – ${createdSlot.endTime} (Capacity: ${createdSlot.capacity})`
        );
      } catch (err) {
        console.warn(`  ⚠️ Slot overlap or conflict: ${err.message}`);
      }
    }
  }

  console.log('\n✨ Demo data seeding finished successfully!\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal error seeding data:', err);
  process.exit(1);
});
