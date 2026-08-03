const { Institution, Inspection } = require('../db');

const getAllInstitutions = async (req, res) => {
  try {
    const list = await Institution.findAll({
      include: [{ model: Inspection, attributes: ['id', 'status', 'complianceScore', 'scheduledDate'] }]
    });
    
    // Parse JSON text fields for safety
    const formatted = list.map(inst => {
      const data = inst.toJSON();
      try { data.accreditationDetails = JSON.parse(data.accreditationDetails || '{}'); } catch(e) {}
      try { data.infrastructureDetails = JSON.parse(data.infrastructureDetails || '{}'); } catch(e) {}
      try { data.departments = JSON.parse(data.departments || '[]'); } catch(e) {}
      return data;
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getInstitutionById = async (req, res) => {
  try {
    const inst = await Institution.findByPk(req.params.id, {
      include: [{ model: Inspection }]
    });
    if (!inst) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    const data = inst.toJSON();
    try { data.accreditationDetails = JSON.parse(data.accreditationDetails || '{}'); } catch(e) {}
    try { data.infrastructureDetails = JSON.parse(data.infrastructureDetails || '{}'); } catch(e) {}
    try { data.departments = JSON.parse(data.departments || '[]'); } catch(e) {}
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createInstitution = async (req, res) => {
  try {
    const { name, type, address, region, accreditationDetails, infrastructureDetails, departments, facultyCount, studentCount, contactEmail, logo } = req.body;
    
    const newInst = await Institution.create({
      name,
      type,
      address,
      region,
      accreditationDetails: typeof accreditationDetails === 'object' ? JSON.stringify(accreditationDetails) : accreditationDetails,
      infrastructureDetails: typeof infrastructureDetails === 'object' ? JSON.stringify(infrastructureDetails) : infrastructureDetails,
      departments: typeof departments === 'object' ? JSON.stringify(departments) : departments,
      facultyCount,
      studentCount,
      contactEmail,
      logo
    });

    res.status(201).json(newInst);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateInstitution = async (req, res) => {
  try {
    const inst = await Institution.findByPk(req.params.id);
    if (!inst) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const { name, type, address, region, accreditationDetails, infrastructureDetails, departments, facultyCount, studentCount, contactEmail, logo, complianceScore } = req.body;

    await inst.update({
      name: name !== undefined ? name : inst.name,
      type: type !== undefined ? type : inst.type,
      address: address !== undefined ? address : inst.address,
      region: region !== undefined ? region : inst.region,
      accreditationDetails: accreditationDetails !== undefined ? (typeof accreditationDetails === 'object' ? JSON.stringify(accreditationDetails) : accreditationDetails) : inst.accreditationDetails,
      infrastructureDetails: infrastructureDetails !== undefined ? (typeof infrastructureDetails === 'object' ? JSON.stringify(infrastructureDetails) : infrastructureDetails) : inst.infrastructureDetails,
      departments: departments !== undefined ? (typeof departments === 'object' ? JSON.stringify(departments) : departments) : inst.departments,
      facultyCount: facultyCount !== undefined ? facultyCount : inst.facultyCount,
      studentCount: studentCount !== undefined ? studentCount : inst.studentCount,
      contactEmail: contactEmail !== undefined ? contactEmail : inst.contactEmail,
      logo: logo !== undefined ? logo : inst.logo,
      complianceScore: complianceScore !== undefined ? complianceScore : inst.complianceScore
    });

    res.json({ message: 'Institution profile updated successfully', institution: inst });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllInstitutions,
  getInstitutionById,
  createInstitution,
  updateInstitution
};
