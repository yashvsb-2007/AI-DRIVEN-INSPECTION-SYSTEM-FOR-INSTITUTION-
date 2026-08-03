const { Finding, Inspection } = require('../db');

// AI Computer Vision Simulator
const analyzeImageEvidence = async (req, res) => {
  try {
    const { category, fileName } = req.body;
    let detections = [];
    let complianceScoreModifier = 0;

    // Simulate different detections based on category or custom mock name
    const normalizedName = (fileName || '').toLowerCase();
    
    if (category === 'Safety & Fire Compliance' || normalizedName.includes('fire') || normalizedName.includes('extinguisher')) {
      detections = [
        {
          label: 'Expired Fire Extinguisher Tag',
          confidence: 0.96,
          box: [210, 150, 480, 520],
          severity: 'high',
          description: 'Fire extinguisher pressure inspection tag indicates expired certification (March 2026).'
        },
        {
          label: 'Blocked Access to Fire Hose',
          confidence: 0.89,
          box: [50, 300, 180, 600],
          severity: 'medium',
          description: 'Storage boxes and academic papers stacked in front of safety exit pathways.'
        }
      ];
      complianceScoreModifier = -25;
    } else if (category === 'Sanitation' || normalizedName.includes('dirty') || normalizedName.includes('leak') || normalizedName.includes('bathroom')) {
      detections = [
        {
          label: 'Standing Water and Drainage Blockage',
          confidence: 0.94,
          box: [300, 100, 600, 500],
          severity: 'high',
          description: 'Active plumbing leaks under washing basins, causing pooling water hazard on floor tiles.'
        },
        {
          label: 'Damaged Sanitation Fixture',
          confidence: 0.91,
          box: [120, 200, 300, 450],
          severity: 'medium',
          description: 'Sink basin exhibits prominent structural crack.'
        }
      ];
      complianceScoreModifier = -15;
    } else if (category === 'Laboratories' || normalizedName.includes('lab') || normalizedName.includes('chemical')) {
      detections = [
        {
          label: 'Missing Eye Wash Station Signage',
          confidence: 0.85,
          box: [100, 50, 250, 200],
          severity: 'medium',
          description: 'Chemical emergency eyewash station lacks high-visibility regulatory safety sign.'
        },
        {
          label: 'Improper Acid Storage',
          confidence: 0.88,
          box: [400, 150, 550, 380],
          severity: 'high',
          description: 'Concentrated sulfuric acid stored on standard shelves rather than locked fire-resistant cabinet.'
        }
      ];
      complianceScoreModifier = -20;
    } else {
      // Default / general detections for infrastructure
      detections = [
        {
          label: 'Infrastructure Degradation',
          confidence: 0.87,
          box: [50, 50, 320, 400],
          severity: 'low',
          description: 'Visible hairline cracks in masonry work and peeling wall paint.'
        }
      ];
      complianceScoreModifier = -5;
    }

    res.json({
      success: true,
      category,
      detections,
      complianceScoreModifier,
      summary: `AI Scan complete. Detected ${detections.length} anomaly/anomalies.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// AI Document OCR Extractor
const verifyAccreditationDocument = async (req, res) => {
  try {
    const { documentType, fileName } = req.body;
    let extractedData = {};
    let flags = [];
    const normalizedName = (fileName || '').toLowerCase();

    if (documentType === 'fire_safety') {
      extractedData = {
        documentId: 'FS-2025-9831',
        issuedBy: 'State Fire & Safety Authority',
        issueDate: '2025-04-12',
        expiryDate: '2026-04-11',
        validity: 'Expired'
      };
      flags = [
        {
          type: 'EXPIRY_WARNING',
          message: 'This fire safety certificate expired on April 11, 2026. A current audit certificate must be uploaded immediately.',
          severity: 'critical'
        }
      ];
    } else if (documentType === 'naac' || normalizedName.includes('naac') || normalizedName.includes('accreditation')) {
      extractedData = {
        documentId: 'NAAC-2023-A-894',
        issuedBy: 'National Assessment and Accreditation Council',
        issueDate: '2023-11-20',
        expiryDate: '2028-11-19',
        grade: 'A+ Grade',
        cgpa: '3.54 / 4.00',
        validity: 'Active'
      };
      flags = [];
    } else {
      // Default mock extraction
      extractedData = {
        documentId: 'REG-UGC-98214',
        issuedBy: 'University Grants Commission',
        issueDate: '2020-01-10',
        expiryDate: '2030-01-09',
        validity: 'Active'
      };
      flags = [];
    }

    res.json({
      success: true,
      documentType,
      extractedData,
      flags,
      verified: flags.length === 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// AI Chatbot assistant
const chatAssistant = async (req, res) => {
  try {
    const { query } = req.body;
    let answer = '';

    const q = (query || '').toLowerCase();

    if (q.includes('fire') || q.includes('safety') || q.includes('extinguisher')) {
      answer = `### Fire Safety Regulations (InspectAI Assistant)
According to the National Building Code (NBC) Part IV, educational institutions must comply with these guidelines:
1. **Extinguishers**: One ABC Dry Powder extinguisher (min 4kg) for every 100 sq. meters, with active inspection tags not older than 12 months.
2. **Access corridors**: Minimum corridor clear-width of 2.0 meters. Storage bins, tables, or administrative desks are strictly prohibited in escape lanes.
3. **Smoke Detectors**: Mandatory in laboratories, computer centers, and libraries with direct alarm integration to local sirens.
      
*Action advised: Please check the third floor of Block B and resolve the expired tags.*`;
    } else if (q.includes('naac') || q.includes('accreditation') || q.includes('nba')) {
      answer = `### NAAC / NBA Accreditation Requirements
To qualify for a NAAC Grade 'A' or higher, institutions must exhibit:
- **Criterion I (Curricular Aspects)**: Evidence of curriculum updates and industry integration.
- **Criterion II (Teaching-Learning & Evaluation)**: Student-teacher ratio below 20:1. At least 60% of core faculty must hold a Ph.D.
- **Criterion IV (Infrastructure & Learning Resources)**: 100% digital library catalog access and modern smart-classrooms.

*InspectAI Prediction: Apex Institute currently meets Grade A parameters, but unresolved fire safety issues could cost 10-15 compliance points during physical verification.*`;
    } else if (q.includes('sanitation') || q.includes('washroom') || q.includes('toilet')) {
      answer = `### Sanitation & Hygiene Standards
For schools and colleges, safety codes require:
1. **Ratio**: 1 wash basin and toilet per 30 female students, and 1 per 40 male students.
2. **Maintenance**: Running water 24/7. Flooring must be anti-skid tile work with fully enclosed drainage traps.
3. **Dampness**: Any evidence of wall dampness or active leakage from sinks represents a violation and lowers the score by 15 points.

*InspectAI Prediction: Beacon Valley Academy's sanitation rating is currently 'Unsatisfactory' due to leaking plumbing fixtures in girls wing restrooms.*`;
    } else {
      answer = `### InspectAI Assistant
Hello! I can guide you through the inspection process, state education safety standards, and NAAC/UGC accreditation rules.

**Try asking me about:**
- *What are the safety requirements for Chemistry Labs?*
- *What are the NAAC student-teacher ratio criteria?*
- *How is the compliance score calculated in InspectAI?*`;
    }

    res.json({
      success: true,
      answer
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  analyzeImageEvidence,
  verifyAccreditationDocument,
  chatAssistant
};
