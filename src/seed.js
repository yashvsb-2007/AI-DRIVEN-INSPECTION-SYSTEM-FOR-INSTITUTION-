const bcrypt = require('bcryptjs');
const { sequelize, User, Institution, Inspection, Finding, ActionItem, AuditLog } = require('./db');

async function seed() {
  try {
    console.log('Synchronizing database models...');
    await sequelize.sync({ force: true });
    console.log('Database synced. Starting seed...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create Users
    console.log('Creating users...');
    const superAdmin = await User.create({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@inspectai.org',
      role: 'super_admin',
      name: 'Chief Administrator'
    });

    const authority = await User.create({
      username: 'authority',
      password: hashedPassword,
      email: 'authority@inspectai.org',
      role: 'inspection_authority',
      name: 'Director Eleanor Vance'
    });

    const inspector1 = await User.create({
      username: 'inspector1',
      password: hashedPassword,
      email: 'sarah.jenkins@inspectai.org',
      role: 'inspector',
      name: 'Dr. Sarah Jenkins'
    });

    const inspector2 = await User.create({
      username: 'inspector2',
      password: hashedPassword,
      email: 'james.carter@inspectai.org',
      role: 'inspector',
      name: 'Prof. James Carter'
    });

    const rep1 = await User.create({
      username: 'rep1',
      password: hashedPassword,
      email: 't.moore@apextech.edu',
      role: 'representative',
      name: 'Dean Thomas Moore'
    });

    const rep2 = await User.create({
      username: 'rep2',
      password: hashedPassword,
      email: 'h.ross@beaconvalley.edu',
      role: 'representative',
      name: 'Principal Helen Ross'
    });

    // Create Institutions
    console.log('Creating institutions...');
    const inst1 = await Institution.create({
      name: 'Apex Institute of Technology',
      type: 'college',
      address: '742 Innovation Way, Metro Tech District',
      region: 'North Sector',
      accreditationDetails: JSON.stringify({
        naac: 'A+ Grade (3.54 CGPA), Valid until Dec 2028',
        nba: 'NBA Accredited for Computer Science & Mechanical Eng, Valid until 2027',
        aicte: 'Approved Extension of Approval (EoA) 2026-2027',
        ugc: 'UGC 2(f) & 12(B) status active'
      }),
      infrastructureDetails: JSON.stringify({
        campuses: 1,
        totalAreaSqFt: 150000,
        classrooms: 42,
        labs: 12,
        libraries: 1,
        fireAlarmsInstalled: true,
        hostelCapacity: 450
      }),
      departments: JSON.stringify([
        { name: 'Computer Science & Engineering', faculty: 22, students: 480 },
        { name: 'Electronics & Communication', faculty: 15, students: 300 },
        { name: 'Mechanical Engineering', faculty: 12, students: 240 }
      ]),
      facultyCount: 49,
      studentCount: 1020,
      contactEmail: 'info@apextech.edu',
      logo: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=100&h=100&fit=crop',
      complianceScore: 88.5
    });

    const inst2 = await Institution.create({
      name: 'Beacon Valley Academy',
      type: 'school',
      address: '109 Pinecrest Ridge, Beacon Valley',
      region: 'East Sector',
      accreditationDetails: JSON.stringify({
        cbs_board: 'Affiliation No. 129302, Active',
        state_board: 'Accredited with Grade A+'
      }),
      infrastructureDetails: JSON.stringify({
        campuses: 1,
        totalAreaSqFt: 85000,
        classrooms: 28,
        labs: 4,
        libraries: 1,
        fireAlarmsInstalled: false,
        hostelCapacity: 0
      }),
      departments: JSON.stringify([
        { name: 'Primary Division', faculty: 18, students: 320 },
        { name: 'Secondary Division', faculty: 20, students: 400 }
      ]),
      facultyCount: 38,
      studentCount: 720,
      contactEmail: 'admin@beaconvalley.edu',
      logo: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=100&h=100&fit=crop',
      complianceScore: 74.0
    });

    const inst3 = await Institution.create({
      name: 'Summit Training & Skill Center',
      type: 'training_center',
      address: '42 Commercial Plaza, Hub 2',
      region: 'Central Sector',
      accreditationDetails: JSON.stringify({
        nsdc: 'Approved Training Partner, Ref: TP98432',
        iso9001: 'Certified Quality Management System, Valid until 2029'
      }),
      infrastructureDetails: JSON.stringify({
        campuses: 1,
        totalAreaSqFt: 25000,
        classrooms: 8,
        labs: 3,
        libraries: 0,
        fireAlarmsInstalled: true,
        hostelCapacity: 0
      }),
      departments: JSON.stringify([
        { name: 'Digital Skills & IT', faculty: 6, students: 120 },
        { name: 'Vocational Trades', faculty: 4, students: 80 }
      ]),
      facultyCount: 10,
      studentCount: 200,
      contactEmail: 'contact@summitcenter.org',
      logo: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=100&h=100&fit=crop',
      complianceScore: 94.2
    });

    // Create Inspections
    console.log('Creating inspections...');
    const now = new Date();

    // 1. Completed Inspection
    const insp1 = await Inspection.create({
      institutionId: inst1.id,
      inspectorId: inspector1.id,
      status: 'completed',
      scheduledDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      completedDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      complianceScore: 88.5,
      gpsLocation: JSON.stringify({ lat: 37.7749, lng: -122.4194 }),
      inspectorSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10,15 C 30,5 40,25 60,15 S 80,5 90,20" fill="none" stroke="blue" stroke-width="2"/></svg>',
      checklistData: JSON.stringify({
        infrastructure: { status: 'Satisfactory', score: 90, remarks: 'Spacious campus, but minor wall plastering peeling off in Block B.' },
        classrooms: { status: 'Excellent', score: 95, remarks: 'Equipped with smartboards and well-ventilated.' },
        laboratories: { status: 'Satisfactory', score: 85, remarks: 'Chemical storage labels in chemistry lab need updating.' },
        library: { status: 'Excellent', score: 95, remarks: 'Fully digital catalog, great study spacing.' },
        safety: { status: 'Needs Improvement', score: 70, remarks: 'Fire extinguishers in floor 3 of main block expired.' },
        sanitation: { status: 'Satisfactory', score: 88, remarks: 'Main clean-up standard is high, slight odor in sports wing bathrooms.' },
        faculty: { status: 'Satisfactory', score: 90, remarks: 'All credentials match university records.' },
        facilities: { status: 'Satisfactory', score: 90, remarks: 'Hostel is in decent shape; kitchen audit is clean.' },
        administration: { status: 'Satisfactory', score: 92, remarks: 'Audit logs, student admission ledger are up-to-date.' },
        digital: { status: 'Excellent', score: 96, remarks: '100 Mbps broadband lines and modern servers.' }
      }),
      reportSummary: JSON.stringify({
        summary: 'Apex Institute shows strong compliance with digital infrastructure, administration standards, and classroom setup. However, immediate improvements are required in safety protocols.',
        strengths: ['State-of-the-art smart classrooms', 'Outstanding library digitization', 'Robust administrative and credential records'],
        weaknesses: ['Expired fire safety equipment', 'Minor chemical safety labelling issue in Labs', 'Damp walls in Block B'],
        decision: 'Approved with Conditions'
      })
    });

    // 2. Scheduled/Pending Inspection
    const insp2 = await Inspection.create({
      institutionId: inst2.id,
      inspectorId: inspector2.id,
      status: 'scheduled',
      scheduledDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
    });

    // 3. Inspection currently In Progress
    const insp3 = await Inspection.create({
      institutionId: inst3.id,
      inspectorId: inspector1.id,
      status: 'in_progress',
      scheduledDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Scheduled yesterday
      checklistData: JSON.stringify({
        infrastructure: { status: 'Satisfactory', score: 92, remarks: 'Decent office setup.' },
        classrooms: { status: 'Satisfactory', score: 90, remarks: 'Classroom size is slightly tight but ventilated.' }
      })
    });

    // 4. Inspection under review
    const insp4 = await Inspection.create({
      institutionId: inst2.id,
      inspectorId: inspector1.id,
      status: 'under_review',
      scheduledDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      completedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      complianceScore: 74.0,
      gpsLocation: JSON.stringify({ lat: 37.8044, lng: -122.2711 }),
      inspectorSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 5,20 C 25,25 35,5 65,15 S 75,25 95,5" fill="none" stroke="red" stroke-width="2"/></svg>',
      checklistData: JSON.stringify({
        infrastructure: { status: 'Satisfactory', score: 80, remarks: 'Classrooms are okay, building is old.' },
        classrooms: { status: 'Satisfactory', score: 82, remarks: 'Desks in junior block are outdated.' },
        laboratories: { status: 'Needs Improvement', score: 65, remarks: 'No safety goggles or eye-wash stations in the science laboratory.' },
        library: { status: 'Satisfactory', score: 80, remarks: 'Traditional libraries with decent book count.' },
        safety: { status: 'Unsatisfactory', score: 50, remarks: 'Complete absence of fire alarms/smoke detectors in school hallways.' },
        sanitation: { status: 'Needs Improvement', score: 60, remarks: 'Sanitation facilities are unhygienic with broken pipes in girls restroom.' },
        faculty: { status: 'Satisfactory', score: 85, remarks: 'Teachers have basic credentials.' },
        facilities: { status: 'Satisfactory', score: 82, remarks: 'Playground is spacious.' },
        administration: { status: 'Satisfactory', score: 80, remarks: 'Ledgers are present.' },
        digital: { status: 'Satisfactory', score: 76, remarks: 'Only basic computer lab.' }
      }),
      reportSummary: JSON.stringify({
        summary: 'Beacon Valley Academy exhibits major safety, sanitation, and chemical lab security vulnerabilities. Corrective actions must be implemented immediately.',
        strengths: ['Spacious playground and campus space', 'Dedicated teaching staff'],
        weaknesses: ['Zero active fire safety systems', 'Damaged and unhygienic sanitation fixtures', 'Unregulated science lab chemicals'],
        decision: 'Action Required'
      })
    });

    // Create Findings (Violations)
    console.log('Creating findings...');
    const find1 = await Finding.create({
      inspectionId: insp1.id,
      category: 'Safety & Fire Compliance',
      description: 'Fire extinguishers on the 3rd floor of the Main Administrative block have expired inspection tags (Expiry date: March 2026).',
      severity: 'high',
      aiDetected: true,
      resolved: false
    });

    const find2 = await Finding.create({
      inspectionId: insp1.id,
      category: 'Laboratories',
      description: 'Corrosive chemicals in the Chemistry Laboratory stored without clear warnings or safety data sheets (SDS) on display.',
      severity: 'medium',
      aiDetected: false,
      resolved: true
    });

    const find3 = await Finding.create({
      inspectionId: insp4.id,
      category: 'Safety & Fire Compliance',
      description: 'Complete lack of fire alarms or smoke detectors in school hallways and library.',
      severity: 'critical',
      aiDetected: true,
      resolved: false
    });

    const find4 = await Finding.create({
      inspectionId: insp4.id,
      category: 'Sanitation',
      description: 'Three wash basins in the girls wing restrooms are fully broken and have continuous plumbing leakages, causing damp pooling floors.',
      severity: 'high',
      aiDetected: true,
      resolved: false
    });

    // Create Action Items (Kanban)
    console.log('Creating action items...');
    await ActionItem.create({
      institutionId: inst1.id,
      inspectionId: insp1.id,
      findingId: find1.id,
      title: 'Replace Expired Fire Extinguishers',
      description: 'Purchase and mount certified, up-to-date dry powder fire extinguishers across block B (3rd floor). Upload photos of installed canisters.',
      priority: 'high',
      status: 'in_progress',
      deadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
    });

    await ActionItem.create({
      institutionId: inst1.id,
      inspectionId: insp1.id,
      findingId: find2.id,
      title: 'Add Safety Labels & SDS in Chemistry Lab',
      description: 'Apply hazardous material labeling and place MSDS binders on chemical shelves.',
      priority: 'medium',
      status: 'resolved',
      deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      evidencePath: '/uploads/chemical_sds_proof.jpg',
      comments: 'Labels have been affixed and SDS sheets mounted. Verified by Inspector Jenkins.'
    });

    await ActionItem.create({
      institutionId: inst2.id,
      inspectionId: insp4.id,
      findingId: find3.id,
      title: 'Install Fire Alarms and Smoke Sensors',
      description: 'Mandatory installation of battery-operated alarm sirens and smoke sensors in main corridors. Certified layout diagram required.',
      priority: 'critical',
      status: 'pending',
      deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    });

    await ActionItem.create({
      institutionId: inst2.id,
      inspectionId: insp4.id,
      findingId: find4.id,
      title: 'Repair girls wing sanitation and fix leakages',
      description: 'Replace cracked wash basins and solve active plumbing leakage. Take clean, well-lit photos for submission.',
      priority: 'high',
      status: 'under_review',
      deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      evidencePath: '/uploads/repaired_sanitation_sink.jpg',
      comments: 'Work completed by Plumber service. Awaiting final approval from Inspection Authority.'
    });

    // Create Audit Logs
    console.log('Creating audit logs...');
    await AuditLog.create({
      userId: superAdmin.id,
      action: 'USER_MGT',
      details: 'Super Admin created profiles for new inspectors Dr. Sarah Jenkins and Prof. James Carter.'
    });

    await AuditLog.create({
      userId: authority.id,
      action: 'INSP_SCHEDULE',
      details: 'Authority scheduled upcoming inspection for Beacon Valley Academy on ' + insp2.scheduledDate.toLocaleDateString()
    });

    await AuditLog.create({
      userId: inspector1.id,
      action: 'INSP_SUBMIT',
      details: 'Completed inspection and compiled AI reports for Apex Institute of Technology.'
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Check if run directly
if (require.main === module) {
  seed();
}

module.exports = seed;
