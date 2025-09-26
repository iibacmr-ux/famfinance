// Application JavaScript - Gestionnaire Financier Familial - Version Corrigée

// Function to fix migrated data structure with proper ID system
function fixMigratedData() {
  console.log('Fixing migrated data structure with proper ID system...');
  
  // Create new ID mapping: P1, P2, P3... for projects, T11, T12, T13... for tasks
  const newProjectIds = new Map(); // old ID -> new ID (P1, P2, etc.)
  const newTaskIds = new Map(); // old ID -> new ID (T11, T12, etc.)
  
  // First pass: assign new IDs to projects (P1, P2, P3...)
  let projectCounter = 1;
  if (appData.projects) {
    appData.projects.forEach(item => {
      if (item.parent_id === null) {
        const newId = `P${projectCounter}`;
        newProjectIds.set(item.id, newId);
        item.id = newId;
        projectCounter++;
        console.log(`Project: ${item.id} -> ${newId}`);
      }
    });
  }
  
  // Second pass: assign new IDs to tasks (T11, T12, T13...)
  if (appData.projects) {
    appData.projects.forEach(item => {
      if (item.parent_id !== null) {
        // This is a task - find its parent project using the old parent_id
        const oldParentId = item.parent_id;
        
        // Try to find parent by matching the numeric part
        let parentNewId = null;
        const taskNumericId = item.id.split('_')[0]; // Extract numeric part from task ID
        
        // Look for a project that matches the task's numeric ID pattern
        // Task ID like "11_└─ Descente" should match project with ID starting with "1"
        const projectNumericId = taskNumericId.charAt(0); // First digit of task ID
        
        // Find the project with matching numeric ID
        for (const [oldProjectId, newProjectId] of newProjectIds.entries()) {
          if (oldProjectId.startsWith(projectNumericId + '_')) {
            parentNewId = newProjectId;
            break;
          }
        }
        
        if (parentNewId) {
          // Generate task ID based on parent: P1 -> T11, T12, T13...
          const parentNumber = parentNewId.substring(1); // Extract "1" from "P1"
          const taskNumber = item.id.split('_')[0]; // Extract original task number
          const newTaskId = `T${parentNumber}${taskNumber}`;
          
          newTaskIds.set(item.id, newTaskId);
          item.id = newTaskId;
          item.parent_id = parentNewId;
          
          console.log(`Task: ${item.id} -> ${newTaskId} (parent: ${parentNewId})`);
        } else {
          console.warn(`No parent found for task ${item.id} with parent_id ${item.parent_id}`);
          item.parent_id = null;
        }
        
        // Add missing fields for tasks
        if (!item.type) item.type = 'Tâche';
        if (!item.priority) item.priority = 'Moyenne';
        if (!item.responsible) item.responsible = 'William';
        if (!item.dependency) item.dependency = null;
        if (!item.roi) item.roi = 0;
        if (!item.cash_flow) item.cash_flow = 0;
        if (!item.monthly_forecast) item.monthly_forecast = 0;
        if (!item.realized_date) item.realized_date = null;
        if (!item.notes) item.notes = item.note || '';
      } else {
        // This is a project - add missing fields
        if (!item.type) item.type = 'Projet';
        if (!item.priority) item.priority = 'Moyenne';
        if (!item.responsible) item.responsible = 'William';
        if (!item.dependency) item.dependency = null;
        if (!item.probability) item.probability = 50;
        if (!item.roi) item.roi = 0;
        if (!item.cash_flow) item.cash_flow = 0;
        if (!item.monthly_forecast) item.monthly_forecast = 0;
        if (!item.realized_date) item.realized_date = null;
        if (!item.notes) item.notes = item.note || '';
      }
      
      // Fix null dates
      if (!item.start_date) item.start_date = '2025-01-01';
      if (!item.end_date) item.end_date = '2025-12-31';
    });
  }
  
  // Fix sources - assign new IDs (S1, S2, S3...)
  if (appData.sources) {
    let sourceCounter = 1;
    appData.sources.forEach(source => {
      const newSourceId = `S${sourceCounter}`;
      console.log(`Source: ${source.id} -> ${newSourceId}`);
      source.id = newSourceId;
      sourceCounter++;
      
      if (!source.status) source.status = 'ACTIF';
      if (!source.forecast) source.forecast = source.available || 0;
      if (!source.regularity) source.regularity = 'Récurrent';
      if (!source.notes) source.notes = '';
    });
  }
  
  // Fix allocations - update source_id and task_id references
  if (appData.allocations) {
    appData.allocations.forEach(allocation => {
      // Update source_id - we need to find the corresponding new source ID
      if (allocation.source_id) {
        // Find the source by name or other identifier and get its new ID
        const source = appData.sources.find(s => s.id === allocation.source_id || s.name === allocation.source_name);
        if (source) {
          console.log(`Allocation source_id: ${allocation.source_id} -> ${source.id}`);
          allocation.source_id = source.id;
        } else {
          console.warn(`No source found for allocation source_id: ${allocation.source_id}`);
        }
      }
      
      // Update task_id using the new task ID mapping
      if (allocation.task_id) {
        const newTaskId = newTaskIds.get(allocation.task_id);
        if (newTaskId) {
          console.log(`Allocation task_id: ${allocation.task_id} -> ${newTaskId}`);
          allocation.task_id = newTaskId;
        } else {
          console.warn(`No new task ID found for allocation task_id: ${allocation.task_id}`);
        }
      }
      
      if (!allocation.status) allocation.status = allocation.actual > 0 ? 'Réalisé' : 'Planifié';
      if (!allocation.notes) allocation.notes = '';
      if (!allocation.created_at) allocation.created_at = new Date().toISOString();
      if (!allocation.updated_at) allocation.updated_at = new Date().toISOString();
    });
  }
  
  console.log('Data structure fixed!');
  
  // Recalculate KPIs after fixing data structure
  try {
    renderKPIs();
    renderSourcesKPIs();
    console.log('KPIs recalculated after data fix');
  } catch (e) {
    console.warn('Error recalculating KPIs:', e);
  }
  
  // Log the updated data structure for verification
  console.log('=== UPDATED DATA STRUCTURE ===');
  console.log('Projects:', appData.projects.filter(p => p.parent_id === null).map(p => ({id: p.id, name: p.name})));
  console.log('Tasks:', appData.projects.filter(p => p.parent_id !== null).slice(0, 5).map(t => ({id: t.id, name: t.name, parent_id: t.parent_id})));
  console.log('Sources:', appData.sources.slice(0, 3).map(s => ({id: s.id, name: s.name})));
  console.log('Allocations:', appData.allocations.slice(0, 3).map(a => ({id: a.id, source_id: a.source_id, task_id: a.task_id})));
}

// Global data and state with complete application data
let appData = {
  "projects": [
    {
      "id": "P1",
      "name": "Titre foncier Mejeuh et Baleng",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier & Foncier",
      "beneficiary": "Famille",
      "start_date": "2025-01-02",
      "end_date": "2025-12-31",
      "note": "Terrain location",
      "parent_id": null,
      "type": "Projet",
      "budget": 4469969,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Terrain location"
    },
    {
      "id": "P2",
      "name": "Titre foncier Logbaba, Bepanda, Limbe avec Parrain > 3M /m (10)",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier & Foncier",
      "beneficiary": "Famille",
      "start_date": "2025-01-15",
      "end_date": "2026-12-31",
      "note": "Terrain location",
      "parent_id": null,
      "budget": 2815000,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Terrain location"
    },
    {
      "id": "P3",
      "name": "Immeuble Bepanda (3 meublés)",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier locatif",
      "beneficiary": "Famille",
      "start_date": "2024-12-01",
      "end_date": "2025-01-31",
      "note": "Projet avec tâches",
      "parent_id": null,
      "budget": 4000000,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Projet avec tâches"
    },
    {
      "id": "P4",
      "name": "Logbaba - confort: Achat Starlink",
      "type_kiyosaki": "Passif",
      "category": "Confort résidentiel",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P5",
      "name": "Logbaba - sécurité: Installation 3 caméras + 2 bouquets TV",
      "type_kiyosaki": "Passif",
      "category": "Sécurité",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P6",
      "name": "Logbaba - sécurité: Installation 3 lampadaires solaires",
      "type_kiyosaki": "Passif",
      "category": "Sécurité",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P7",
      "name": "Nouvelle voiture: Vendre puis Acheter nouvelle voiture 8M",
      "type_kiyosaki": "Passif",
      "category": "Mobilité",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P8",
      "name": "Logbaba - rénovation: Plomberie : Rez de chaussée",
      "type_kiyosaki": "Passif",
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-01-07",
      "end_date": "2025-01-07",
      "note": null,
      "parent_id": null,
      "budget": 1181600,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P9",
      "name": "Logbaba - Electricité: Rénovation du plan électrique Logbaba > 2M /m (11)",
      "type_kiyosaki": "Passif",
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 118000,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P10",
      "name": "Voyage avec enfants en Suisse > 23 juin au 15 août: 2.5M ()",
      "type_kiyosaki": "Passif",
      "category": "Voyage familiaux",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-08-27",
      "note": null,
      "parent_id": null,
      "budget": 2252280,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P11",
      "name": "Exposition Uriel Oct-Nov 2025 k/m (9)",
      "type_kiyosaki": "Investissement formation",
      "category": "Éducation",
      "beneficiary": "Uriel",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P12",
      "name": "Célébration 15 ans mariage > 2M > Dec25 ou Jan26 /m (3)",
      "type_kiyosaki": "Passif",
      "category": "Evènements familiaux",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P13",
      "name": "70 ans Papa Dec25 > 1M /m (4+5)",
      "type_kiyosaki": "Passif",
      "category": "Evènements familiaux",
      "beneficiary": "Grand-Père Aimé",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P14",
      "name": "70 ans Maman Juin25  > 1M /m (4+5)",
      "type_kiyosaki": "Passif",
      "category": "Evènements familiaux",
      "beneficiary": "Grand-Mère Lucile",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P15",
      "name": "Pension / Scolarité Enfants > 6M (6)",
      "type_kiyosaki": "Investissement formation",
      "category": "Éducation",
      "beneficiary": "Enfants",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P16",
      "name": "Cotisation Tata Lucie /m (19)",
      "type_kiyosaki": "Actif générateur",
      "category": "Sécurité",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P17",
      "name": "Famille: Assurance maladie > 1M/an /m (20)",
      "type_kiyosaki": "Passif",
      "category": "Santé",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P18",
      "name": "Immeuble: M. Janvier - Gardien",
      "type_kiyosaki": "Passif",
      "category": "Immobilier locatif",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P19",
      "name": "Logbaba - Chauffeur /m (8)",
      "type_kiyosaki": "Passif",
      "category": "Confort résidentiel",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P20",
      "name": "Argent de côté pour les imprévus /m (18)",
      "type_kiyosaki": "Investissement formation",
      "category": "Sécurité",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P21",
      "name": "Logbaba - sécurité: surelevé ou fil-barbelé",
      "type_kiyosaki": "Passif",
      "category": "Sécurité",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P22",
      "name": "Logbaba - Confort Eau: Plomberie : Installer Suppresseur pour pousser l'eau du cubitenaire",
      "type_kiyosaki": "Passif",
      "category": "Confort résidentiel",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P23",
      "name": "Logbaba Plomberie: Refaire les 2 douches du RdC",
      "type_kiyosaki": "Passif",
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P24",
      "name": "Piano Naelle > 300k",
      "type_kiyosaki": "Investissement formation",
      "category": "Éducation",
      "beneficiary": "Naëlle",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P25",
      "name": "Rafraichir les murs de la maison. Peinture",
      "type_kiyosaki": "Passif",
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P26",
      "name": "Ibrahim (Dschang)",
      "type_kiyosaki": "Passif",
      "category": "Sécurité",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P27",
      "name": "Maladie soins Uriel et Nell-Henri",
      "type_kiyosaki": "Passif",
      "category": "Santé",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P28",
      "name": "Hospitalisation & Maladies",
      "type_kiyosaki": "Passif",
      "category": "Santé",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P29",
      "name": "Audit ancien immeuble",
      "type_kiyosaki": "Investissement formation",
      "category": "Immobilier locatif",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P30",
      "name": "Mettre en location 2 Meublés",
      "type_kiyosaki": "Investissement formation",
      "category": "Immobilier locatif",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P31",
      "name": "Logbaba - Maintenance: refaire 4 portes",
      "type_kiyosaki": "Passif",
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P32",
      "name": "Fixer l'ancien immeuble (C'est un Livrable du rapport d'audit)",
      "type_kiyosaki": "Investissement formation",
      "category": "Immobilier locatif",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P33",
      "name": "Voyage Alix Mars 2026 3k€ (billet d'avion: tata Lucie)",
      "type_kiyosaki": "Passif",
      "category": "Voyage personnels",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P34",
      "name": "Voyage avec Alix et enfants en Suisse > 23 juin au 15 août 2026: 10k€",
      "type_kiyosaki": "Passif",
      "category": "Voyage familiaux",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P35",
      "name": "Alix: 2 implants sur 3 (4k€ = 2M600k)",
      "type_kiyosaki": "Passif",
      "category": "Santé",
      "beneficiary": "Alix",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "P36",
      "name": "Vacances à Dschang (400k)",
      "type_kiyosaki": "Passif",
      "category": "Evènements familiaux",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": null,
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "type": "Projet",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "probability": 50,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T111",
      "name": "  └─ Descente Mejeuh et Johny Baleng",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier & Foncier",
      "beneficiary": "Famille",
      "start_date": "2025-01-02",
      "end_date": "2025-01-02",
      "note": "Fondations ok",
      "parent_id": "P1",
      "budget": 2169969,
      "allocated": 2169969,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T112",
      "name": "  └─ 2e descente Geomètre pour levée",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier & Foncier",
      "beneficiary": "Famille",
      "start_date": "2025-01-13",
      "end_date": "2025-01-13",
      "note": "Après plomberie",
      "parent_id": "P1",
      "budget": 200000,
      "allocated": 200000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Après plomberie"
    },
    {
      "id": "T113",
      "name": "  └─ Extra derogation (car > 1ha)",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier & Foncier",
      "beneficiary": "Famille",
      "start_date": "2025-02-01",
      "end_date": "2025-02-01",
      "note": "Après plomberie",
      "parent_id": "P1",
      "budget": 600000,
      "allocated": 600000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Après plomberie"
    },
    {
      "id": "T114",
      "name": "  └─ Dérogation",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier & Foncier",
      "beneficiary": "Famille",
      "start_date": "2025-03-04",
      "end_date": "2025-03-04",
      "note": "Après plomberie",
      "parent_id": "P1",
      "budget": 400000,
      "allocated": 400000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Après plomberie"
    },
    {
      "id": "T115",
      "name": "  └─ Publication ",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier & Foncier",
      "beneficiary": "Famille",
      "start_date": "2025-04-22",
      "end_date": "2025-04-22",
      "note": "Après plomberie",
      "parent_id": "P1",
      "budget": 500000,
      "allocated": 500000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Après plomberie"
    },
    {
      "id": "T116",
      "name": "  └─ Après publication",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier & Foncier",
      "beneficiary": "Famille",
      "start_date": "2025-10-01",
      "end_date": "2025-12-31",
      "note": "Après plomberie",
      "parent_id": "P1",
      "budget": 600000,
      "allocated": 0,
      "remaining": 600000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Après plomberie"
    },
    {
      "id": "T221",
      "name": "  └─ Descente Mejeuh et Johny Baleng",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier & Foncier",
      "beneficiary": "Famille",
      "start_date": "2026-02-01",
      "end_date": "2026-12-31",
      "note": "Fondations ok",
      "parent_id": "P2",
      "budget": 2000000,
      "allocated": 0,
      "remaining": 2000000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T331",
      "name": "  └─ Plomberie complète",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier locatif",
      "beneficiary": "Famille",
      "start_date": "2024-12-01",
      "end_date": "2025-01-31",
      "note": "Fondations ok",
      "parent_id": "P3",
      "budget": 800000,
      "allocated": 200000,
      "remaining": 600000,
      "progress": 25,
      "status": "En cours",
      "probability": 25,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T332",
      "name": "  └─ Électricité + éclairage",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier locatif",
      "beneficiary": "Famille",
      "start_date": "2024-12-01",
      "end_date": "2025-01-31",
      "note": "Après plomberie",
      "parent_id": "P3",
      "budget": 600000,
      "allocated": 0,
      "remaining": 600000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Après plomberie"
    },
    {
      "id": "T333",
      "name": "  └─ Aménagement 3 meublés",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier locatif",
      "beneficiary": "Famille",
      "start_date": "2024-12-01",
      "end_date": "2025-01-31",
      "note": "Gros budget",
      "parent_id": "P3",
      "budget": 2100000,
      "allocated": 0,
      "remaining": 2100000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Gros budget"
    },
    {
      "id": "T334",
      "name": "  └─ Marketing + mise service",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier locatif",
      "beneficiary": "Famille",
      "start_date": "2024-12-01",
      "end_date": "2025-01-31",
      "note": "Génère revenus",
      "parent_id": "P3",
      "budget": 500000,
      "allocated": 0,
      "remaining": 500000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Génère revenus"
    },
    {
      "id": "T441",
      "name": "  └─ Achat Starlink",
      "type_kiyosaki": "Actif générateur",
      "category": "Confort résidentiel",
      "beneficiary": "Famille",
      "start_date": "2024-12-20",
      "end_date": "2024-12-23",
      "note": "Fondations ok",
      "parent_id": "P4",
      "budget": 300000,
      "allocated": 300000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T551",
      "name": "  └─ Installation 3 caméras + 2 bouquets TV",
      "type_kiyosaki": "Actif générateur",
      "category": "Sécurité",
      "beneficiary": "Famille",
      "start_date": "2025-01-04",
      "end_date": "2025-01-05",
      "note": "Fondations ok",
      "parent_id": "P5",
      "budget": 200000,
      "allocated": 200000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T661",
      "name": "  └─ Achat & Installation 3 lampadaires solaires",
      "type_kiyosaki": "Actif générateur",
      "category": "Sécurité",
      "beneficiary": "Famille",
      "start_date": "2025-01-04",
      "end_date": "2025-01-05",
      "note": "Fondations ok",
      "parent_id": "P6",
      "budget": 100000,
      "allocated": 100000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T771",
      "name": "  └─ Acheter nouvelle voiture 8M",
      "type_kiyosaki": "Passif",
      "category": "Mobilité",
      "beneficiary": "Famille",
      "start_date": "2024-01-01",
      "end_date": "2025-01-04",
      "note": null,
      "parent_id": "P7",
      "budget": 8600000,
      "allocated": 8600000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T772",
      "name": "  └─ Faire Mutation 435k",
      "type_kiyosaki": "Passif",
      "category": "Mobilité",
      "beneficiary": "Famille",
      "start_date": "2025-01-04",
      "end_date": "2025-01-10",
      "note": null,
      "parent_id": "P7",
      "budget": 435000,
      "allocated": 435000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T773",
      "name": "  └─ Assurance 300k",
      "type_kiyosaki": "Passif",
      "category": "Mobilité",
      "beneficiary": "Famille",
      "start_date": "2025-01-04",
      "end_date": "2025-01-08",
      "note": null,
      "parent_id": "P7",
      "budget": 300000,
      "allocated": 300000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T774",
      "name": "  └─ Travaux Mécanicien de mise en route 475k",
      "type_kiyosaki": "Actif générateur",
      "category": "Mobilité",
      "beneficiary": "Famille",
      "start_date": "2025-01-04",
      "end_date": "2025-01-15",
      "note": "Fondations ok",
      "parent_id": "P7",
      "budget": 475000,
      "allocated": 475000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T881",
      "name": "  └─ Refaire careaux 2 douches du bas (13) 500k",
      "type_kiyosaki": "Passif",
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-01-07",
      "end_date": "2025-01-07",
      "note": null,
      "parent_id": "P8",
      "budget": 87000,
      "allocated": 87000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T882",
      "name": "  └─ Maçonnerie",
      "type_kiyosaki": "Passif",
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": "P8",
      "budget": 0,
      "allocated": 0,
      "remaining": 0,
      "progress": 0,
      "status": "Planifié",
      "probability": 50,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T883",
      "name": "  └─ Logbaba: maçonnerie raccords après plomberie",
      "type_kiyosaki": "Passif",
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": "P8",
      "budget": 115000,
      "allocated": 115000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T991",
      "name": "  └─ Faire des branchements pour relier l'accumulateur au 1er étage",
      "type_kiyosaki": "Passif",
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": "P9",
      "budget": 300000,
      "allocated": 0,
      "remaining": 300000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T992",
      "name": "  └─ Acheter groupe électrogène maison > 1.2M",
      "type_kiyosaki": "Passif",
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": "P9",
      "budget": 2000000,
      "allocated": 0,
      "remaining": 2000000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T993",
      "name": "  └─ Payer accumulateur > 700k",
      "type_kiyosaki": "Passif",
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-01-07",
      "end_date": "2025-02-27",
      "note": null,
      "parent_id": "P9",
      "budget": 700000,
      "allocated": 700000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T994",
      "name": "  └─ Installation Backup: Batterie + Onduleur",
      "type_kiyosaki": "Passif",
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": "P9",
      "budget": 2071500,
      "allocated": 0,
      "remaining": 2071500,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T1101",
      "name": "  └─ BIllet d'avion aller-retour = 2.5M soit 2700€",
      "type_kiyosaki": "Passif",
      "category": "Voyage familiaux",
      "beneficiary": "Famille",
      "start_date": "2025-07-08",
      "end_date": "2025-08-27",
      "note": null,
      "parent_id": "P1",
      "budget": 1969780,
      "allocated": 1969780,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T1102",
      "name": "  └─ Passeport d'Uriel + visa sortie = 182500",
      "type_kiyosaki": "Passif",
      "category": "Voyage familiaux",
      "beneficiary": "Famille",
      "start_date": "2025-06-15",
      "end_date": "2025-07-01",
      "note": null,
      "parent_id": "P1",
      "budget": 182500,
      "allocated": 182500,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T1103",
      "name": "  └─ Frais de Visa: 28k Naelle + 57k Alix + 15k transport yde",
      "type_kiyosaki": "Passif",
      "category": "Voyage familiaux",
      "beneficiary": "Famille",
      "start_date": "2025-06-15",
      "end_date": "2025-06-15",
      "note": null,
      "parent_id": "P1",
      "budget": 100000,
      "allocated": 100000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T1111",
      "name": "  └─ Exposition Uriel - Tableau > 450k",
      "type_kiyosaki": "Investissement formation",
      "category": "Éducation",
      "beneficiary": "Uriel",
      "start_date": "2025-01-05",
      "end_date": "2025-02-28",
      "note": null,
      "parent_id": "P1",
      "budget": 450000,
      "allocated": 450000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T1112",
      "name": "  └─ Réception",
      "type_kiyosaki": "Investissement formation",
      "category": "Éducation",
      "beneficiary": "Uriel",
      "start_date": "2025-08-01",
      "end_date": "2026-03-13",
      "note": null,
      "parent_id": "P1",
      "budget": 1000000,
      "allocated": 0,
      "remaining": 1000000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T1121",
      "name": "  └─ Célébration 15 ans mariage",
      "type_kiyosaki": "Actif générateur",
      "category": "Evènements familiaux",
      "beneficiary": "Famille",
      "start_date": "2025-02-01",
      "end_date": "2025-08-31",
      "note": "Fondations ok",
      "parent_id": "P1",
      "budget": 2000000,
      "allocated": 0,
      "remaining": 2000000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T1131",
      "name": "  └─ 70 ans Papa",
      "type_kiyosaki": "Actif générateur",
      "category": "Evènements familiaux",
      "beneficiary": "Famille",
      "start_date": "2025-02-01",
      "end_date": "2025-07-31",
      "note": "Fondations ok",
      "parent_id": "P1",
      "budget": 500000,
      "allocated": 500000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T1141",
      "name": "  └─ 70 ans Maman",
      "type_kiyosaki": "Passif",
      "category": "Evènements familiaux",
      "beneficiary": "Famille",
      "start_date": "2025-09-01",
      "end_date": "2025-12-31",
      "note": "Fondations ok",
      "parent_id": "P1",
      "budget": 500000,
      "allocated": 0,
      "remaining": 500000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T1151",
      "name": "  └─ Scolarité Enfants",
      "type_kiyosaki": "Investissement formation",
      "category": "Éducation",
      "beneficiary": "Famille",
      "start_date": "2025-09-01",
      "end_date": "2026-03-01",
      "note": "Fondations ok",
      "parent_id": "P1",
      "budget": 6000000,
      "allocated": 1000000,
      "remaining": 5000000,
      "progress": 16.666666666666664,
      "status": "En cours",
      "probability": 16.666666666666664,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T1161",
      "name": "  └─ Cotisation Tata Lucie",
      "type_kiyosaki": "Actif générateur",
      "category": "Sécurité",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-11-01",
      "note": "Fondations ok",
      "parent_id": "P1",
      "budget": 800000,
      "allocated": 600000,
      "remaining": 200000,
      "progress": 75,
      "status": "En cours",
      "probability": 75,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T1171",
      "name": "  └─ Famille: Assurance maladie",
      "type_kiyosaki": "Actif générateur",
      "category": "Santé",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-08-31",
      "note": "Fondations ok",
      "parent_id": "P1",
      "budget": 100000,
      "allocated": 0,
      "remaining": 100000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T1181",
      "name": "  └─ Salaire M. Janvier",
      "type_kiyosaki": "Passif",
      "category": "Immobilier locatif",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": "Fondations ok",
      "parent_id": "P1",
      "budget": 720000,
      "allocated": 480000,
      "remaining": 240000,
      "progress": 66.66666666666666,
      "status": "En cours",
      "probability": 66.66666666666666,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T1191",
      "name": "  └─ Salaire Chauffeur",
      "type_kiyosaki": "Passif",
      "category": "Confort résidentiel",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": "Fondations ok",
      "parent_id": "P1",
      "budget": 744000,
      "allocated": 496000,
      "remaining": 248000,
      "progress": 66.66666666666666,
      "status": "En cours",
      "probability": 66.66666666666666,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T2201",
      "name": "  └─ Epargne imprévus Alix",
      "type_kiyosaki": "Actif générateur",
      "category": "Sécurité",
      "beneficiary": "Famille",
      "start_date": "2025-02-01",
      "end_date": "2025-03-15",
      "note": "Fondations ok",
      "parent_id": "P2",
      "budget": 500000,
      "allocated": 100000,
      "remaining": 400000,
      "progress": 20,
      "status": "En cours",
      "probability": 20,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T2211",
      "name": "  └─ Surelevé ou fil-barbelé",
      "type_kiyosaki": "Actif générateur",
      "category": "Sécurité",
      "beneficiary": "Famille",
      "start_date": "2025-02-01",
      "end_date": "2025-03-15",
      "note": "Fondations ok",
      "parent_id": "P2",
      "budget": 100000,
      "allocated": 0,
      "remaining": 100000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T2221",
      "name": "  └─ Menuiserie après Plomberie",
      "type_kiyosaki": null,
      "category": "Confort résidentiel",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": "P2",
      "budget": 15000,
      "allocated": 15000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T2222",
      "name": "  └─ Acheter  suppresseur",
      "type_kiyosaki": null,
      "category": "Confort résidentiel",
      "beneficiary": "Famille",
      "start_date": "2025-10-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": "P2",
      "budget": 400000,
      "allocated": 0,
      "remaining": 400000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T2223",
      "name": "  └─ Construire la cage du suppresseur",
      "type_kiyosaki": null,
      "category": "Confort résidentiel",
      "beneficiary": "Famille",
      "start_date": "2025-10-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": "P2",
      "budget": 100000,
      "allocated": 0,
      "remaining": 100000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T2231",
      "name": "  └─ Plomberie",
      "type_kiyosaki": "Passif",
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": "P2",
      "budget": 115000,
      "allocated": 115000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T2232",
      "name": "  └─ Peinture (après plomberie)",
      "type_kiyosaki": null,
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": "P2",
      "budget": 150000,
      "allocated": 150000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T2241",
      "name": "  └─ Piano Naelle",
      "type_kiyosaki": "Investissement formation",
      "category": "Éducation",
      "beneficiary": "Naëlle",
      "start_date": "2025-09-01",
      "end_date": "2025-12-31",
      "note": "Fondations ok",
      "parent_id": "P2",
      "budget": 300000,
      "allocated": 0,
      "remaining": 300000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T2251",
      "name": "  └─ Peinture Logbaba",
      "type_kiyosaki": "Actif générateur",
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-10-01",
      "end_date": "2025-12-31",
      "note": "Fondations ok",
      "parent_id": "P2",
      "budget": 300000,
      "allocated": 0,
      "remaining": 300000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T2261",
      "name": "  └─ Salaire Ibrahim ",
      "type_kiyosaki": "Passif",
      "category": "Sécurité",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "note": "Fondations ok",
      "parent_id": "P2",
      "budget": 244800,
      "allocated": 0,
      "remaining": 244800,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T2271",
      "name": "  └─ Frais de santé Uriel et Nell-Henri",
      "type_kiyosaki": "Actif générateur",
      "category": "Santé",
      "beneficiary": "Famille",
      "start_date": "2004-05-01",
      "end_date": "2025-07-01",
      "note": "Fondations ok",
      "parent_id": "P2",
      "budget": 200000,
      "allocated": 200000,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T2281",
      "name": "  └─ Hospitalisation & Maladies",
      "type_kiyosaki": "Actif générateur",
      "category": "Santé",
      "beneficiary": "Famille",
      "start_date": "2025-02-01",
      "end_date": "2025-03-15",
      "note": "Fondations ok",
      "parent_id": "P2",
      "budget": 499610,
      "allocated": 499610,
      "remaining": 0,
      "progress": 100,
      "status": "En cours",
      "probability": 100,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T2291",
      "name": "  └─ Audit ancien immeuble",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier locatif",
      "beneficiary": "Famille",
      "start_date": "2025-01-01",
      "end_date": "2026-05-31",
      "note": "Fondations ok",
      "parent_id": "P2",
      "budget": 4000000,
      "allocated": 0,
      "remaining": 4000000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T3301",
      "name": "  └─ Lampe rechargeable",
      "type_kiyosaki": null,
      "category": "Immobilier locatif",
      "beneficiary": "Famille",
      "start_date": "2025-10-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": "P3",
      "budget": 50000,
      "allocated": 0,
      "remaining": 50000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T3302",
      "name": "  └─ Ventilateur solaire/eneo",
      "type_kiyosaki": null,
      "category": "Immobilier locatif",
      "beneficiary": "Famille",
      "start_date": "2025-10-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": "P3",
      "budget": 100000,
      "allocated": 0,
      "remaining": 100000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T3303",
      "name": " └─ Cubitenaire ",
      "type_kiyosaki": null,
      "category": "Immobilier locatif",
      "beneficiary": "Famille",
      "start_date": "2025-10-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": "P3",
      "budget": 675000,
      "allocated": 0,
      "remaining": 675000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T3311",
      "name": "  └─ Refaire 4 portes",
      "type_kiyosaki": null,
      "category": "Travaux & Maintenance",
      "beneficiary": "Famille",
      "start_date": "2025-10-01",
      "end_date": "2025-12-31",
      "note": null,
      "parent_id": "P3",
      "budget": 400000,
      "allocated": 0,
      "remaining": 400000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": ""
    },
    {
      "id": "T3321",
      "name": "  └─ Fixer l'ancien immeuble",
      "type_kiyosaki": "Actif générateur",
      "category": "Immobilier locatif",
      "beneficiary": "Famille",
      "start_date": "2026-03-01",
      "end_date": "2026-12-31",
      "note": "Fondations ok",
      "parent_id": "P3",
      "budget": 4000000,
      "allocated": 0,
      "remaining": 4000000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T3331",
      "name": "  └─ BIllet d'avion CMR > LAU Alix Mars 2026",
      "type_kiyosaki": "Actif générateur",
      "category": "Voyage personnels",
      "beneficiary": "Famille",
      "start_date": "2025-12-01",
      "end_date": "2026-03-13",
      "note": "Fondations ok",
      "parent_id": "P3",
      "budget": 600000,
      "allocated": 0,
      "remaining": 600000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T3332",
      "name": "  └─ Séjour Alix Lausanne Mars 2026",
      "type_kiyosaki": "Actif générateur",
      "category": "Voyage personnels",
      "beneficiary": "Famille",
      "start_date": "2026-03-10",
      "end_date": "2026-04-10",
      "note": "Fondations ok",
      "parent_id": "P3",
      "budget": 600000,
      "allocated": 0,
      "remaining": 600000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T3341",
      "name": "  └─ 2026 Voyage avec Alix et enfants",
      "type_kiyosaki": "Actif générateur",
      "category": "Voyage familiaux",
      "beneficiary": "Famille",
      "start_date": "2026-07-04",
      "end_date": "2026-09-04",
      "note": "Fondations ok",
      "parent_id": "P3",
      "budget": 800000,
      "allocated": 0,
      "remaining": 800000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T3351",
      "name": "  └─ Frais Dents Alix: 2 implants / 3",
      "type_kiyosaki": "Actif générateur",
      "category": "Santé",
      "beneficiary": "Famille",
      "start_date": "2026-03-10",
      "end_date": "2026-04-10",
      "note": "Fondations ok",
      "parent_id": "P3",
      "budget": 800000,
      "allocated": 0,
      "remaining": 800000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    },
    {
      "id": "T3361",
      "name": "  └─ Noël 25 à Dschang",
      "type_kiyosaki": "Passif",
      "category": "Evènements familiaux",
      "beneficiary": "Famille",
      "start_date": "2025-09-01",
      "end_date": "2025-12-28",
      "note": "Fondations ok",
      "parent_id": "P3",
      "budget": 400000,
      "allocated": 0,
      "remaining": 400000,
      "progress": 0,
      "status": "Planifié",
      "probability": 0,
      "type": "Tâche",
      "priority": "Moyenne",
      "responsible": "William",
      "dependency": null,
      "roi": 0,
      "cash_flow": 0,
      "monthly_forecast": 0,
      "realized_date": null,
      "notes": "Fondations ok"
    }
  ],
  "sources": [
    {
      "id": "S1",
      "name": "Nom_Source",
      "type": "Type_Source",
      "available": "Montant_Disponible",
      "frequency": "Fréquence",
      "availability_date": null,
      "responsible": "Responsable",
      "allocated": 0,
      "remaining": "Montant_Disponible",
      "allocation_rate": 0,
      "status": "ACTIF",
      "forecast": "Montant_Disponible",
      "regularity": "Récurrent",
      "notes": ""
    },
    {
      "id": "S2",
      "name": "Salaire Sept",
      "type": "Salaire William",
      "available": 900000,
      "frequency": "Variable",
      "availability_date": "2025-09-01",
      "responsible": "William",
      "allocated": 0,
      "remaining": 900000,
      "allocation_rate": 0,
      "status": "ACTIF",
      "forecast": 900000,
      "regularity": "Récurrent",
      "notes": ""
    },
    {
      "id": "S3",
      "name": "IIBA Sept",
      "type": "Business",
      "available": 1000000,
      "frequency": "Variable",
      "availability_date": "2025-09-01",
      "responsible": "Alix",
      "allocated": 0,
      "remaining": 1000000,
      "allocation_rate": 0,
      "status": "ACTIF",
      "forecast": 1000000,
      "regularity": "Récurrent",
      "notes": ""
    },
    {
      "id": "S4",
      "name": "Vente ancienne voiture",
      "type": "Vente personnelle",
      "available": 2000000,
      "frequency": "Ponctuel",
      "availability_date": "2024-12-01",
      "responsible": "William",
      "allocated": 0,
      "remaining": 2000000,
      "allocation_rate": 0,
      "status": "ACTIF",
      "forecast": 2000000,
      "regularity": "Récurrent",
      "notes": ""
    },
    {
      "id": "S5",
      "name": "Economie 2024",
      "type": "Salaire William",
      "available": 3000000,
      "frequency": "Ponctuel",
      "availability_date": "2025-06-01",
      "responsible": "William",
      "allocated": 0,
      "remaining": 3000000,
      "allocation_rate": 0,
      "status": "ACTIF",
      "forecast": 3000000,
      "regularity": "Récurrent",
      "notes": ""
    },
    {
      "id": "S6",
      "name": "Salaire Oct",
      "type": "Salaire William",
      "available": 900000,
      "frequency": "Variable",
      "availability_date": "2025-10-01",
      "responsible": "William",
      "allocated": 0,
      "remaining": 900000,
      "allocation_rate": 0,
      "status": "ACTIF",
      "forecast": 900000,
      "regularity": "Récurrent",
      "notes": ""
    },
    {
      "id": "S7",
      "name": "Salaire Nov",
      "type": "Salaire William",
      "available": 900000,
      "frequency": "Variable",
      "availability_date": "2025-11-01",
      "responsible": "William",
      "allocated": 0,
      "remaining": 900000,
      "allocation_rate": 0,
      "status": "ACTIF",
      "forecast": 900000,
      "regularity": "Récurrent",
      "notes": ""
    },
    {
      "id": "S8",
      "name": "Salaire Dev",
      "type": "Salaire William",
      "available": 850000,
      "frequency": "Variable",
      "availability_date": "2025-12-01",
      "responsible": "William",
      "allocated": 0,
      "remaining": 850000,
      "allocation_rate": 0,
      "status": "ACTIF",
      "forecast": 850000,
      "regularity": "Récurrent",
      "notes": ""
    },
    {
      "id": "S9",
      "name": "Tata Lucie Cotisation",
      "type": "Épargne",
      "available": 800000,
      "frequency": "Ponctuel",
      "availability_date": "2025-12-01",
      "responsible": "Alix",
      "allocated": 0,
      "remaining": 800000,
      "allocation_rate": 0,
      "status": "ACTIF",
      "forecast": 800000,
      "regularity": "Récurrent",
      "notes": ""
    },
    {
      "id": "S10",
      "name": "Salaire avant Juillet",
      "type": "Salaire William",
      "available": 600000,
      "frequency": "Variable",
      "availability_date": "2025-08-01",
      "responsible": "William",
      "allocated": 0,
      "remaining": 600000,
      "allocation_rate": 0,
      "status": "ACTIF",
      "forecast": 600000,
      "regularity": "Récurrent",
      "notes": ""
    }
  ],
  "allocations": [
    {
      "id": "allocation_ID_0",
      "source_id": "source_Source_ID_Source_Nom_AUTO",
      "task_id": "task_Tâche_ID_Tâche_Nom_AUTO",
      "planned": "Prévu_FCFA",
      "planned_date": null,
      "actual": "Réel_FCFA",
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": null,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_1_1",
      "source_id": "source_3_Vente ancienne voiture",
      "task_id": "T771",
      "planned": 2000000,
      "planned_date": "2025-03-01",
      "actual": 2000000,
      "actual_date": "2025-03-01",
      "month": "2025-03",
      "year": "2025",
      "variance": 0,
      "status": "Réalisé",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_2_2",
      "source_id": "source_4_Economie 2024",
      "task_id": "T2291",
      "planned": 3000000,
      "planned_date": "2025-06-01",
      "actual": 3000000,
      "actual_date": "2025-06-01",
      "month": "2025-06",
      "year": "2025",
      "variance": 0,
      "status": "Réalisé",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_3_3",
      "source_id": "source_2_IIBA Sept",
      "task_id": "T1151",
      "planned": 833333.3333333334,
      "planned_date": "2025-09-01",
      "actual": 1000000,
      "actual_date": "2025-09-04",
      "month": "2025-09",
      "year": "2025",
      "variance": 166666.66666666663,
      "status": "Réalisé",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_4_4",
      "source_id": "source_1_Salaire Sept",
      "task_id": "T1181",
      "planned": 60000,
      "planned_date": "2025-09-01",
      "actual": 0,
      "actual_date": null,
      "month": "2025-09",
      "year": "2025",
      "variance": -60000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_5_5",
      "source_id": "source_1_Salaire Sept",
      "task_id": "T1191",
      "planned": 62000,
      "planned_date": "2025-09-01",
      "actual": 0,
      "actual_date": null,
      "month": "2025-09",
      "year": "2025",
      "variance": -62000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_6_6",
      "source_id": "source_1_Salaire Sept",
      "task_id": "T2261",
      "planned": 61200,
      "planned_date": "2025-09-01",
      "actual": 0,
      "actual_date": null,
      "month": "2025-09",
      "year": "2025",
      "variance": -61200,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_7_7",
      "source_id": "source_1_Salaire Sept",
      "task_id": "T2241",
      "planned": 75000,
      "planned_date": "2025-09-01",
      "actual": 0,
      "actual_date": null,
      "month": "2025-09",
      "year": "2025",
      "variance": -75000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_8_8",
      "source_id": "source_1_Salaire Sept",
      "task_id": "T1112",
      "planned": 166666.66666666666,
      "planned_date": "2025-09-01",
      "actual": 0,
      "actual_date": null,
      "month": "2025-09",
      "year": "2025",
      "variance": -166666.66666666666,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_9_9",
      "source_id": "source_1_Salaire Sept",
      "task_id": "T3361",
      "planned": 100000,
      "planned_date": "2025-09-01",
      "actual": 600000,
      "actual_date": "2025-08-01",
      "month": "2025-09",
      "year": "2025",
      "variance": 500000,
      "status": "Réalisé",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_10_10",
      "source_id": "source_5_Salaire Oct",
      "task_id": "T1151",
      "planned": 833333.3333333334,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -833333.3333333334,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_11_11",
      "source_id": "source_5_Salaire Oct",
      "task_id": "T1181",
      "planned": 60000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -60000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_12_12",
      "source_id": "source_5_Salaire Oct",
      "task_id": "T1191",
      "planned": 62000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -62000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_13_13",
      "source_id": "source_5_Salaire Oct",
      "task_id": "T2261",
      "planned": 61200,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -61200,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_14_14",
      "source_id": "source_5_Salaire Oct",
      "task_id": "T2241",
      "planned": 75000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -75000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_15_15",
      "source_id": "source_5_Salaire Oct",
      "task_id": "T1112",
      "planned": 166666.66666666666,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -166666.66666666666,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_16_16",
      "source_id": "source_5_Salaire Oct",
      "task_id": "T3361",
      "planned": 100000,
      "planned_date": null,
      "actual": 1000000,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": 900000,
      "status": "Réalisé",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_17_17",
      "source_id": "source_6_Salaire Nov",
      "task_id": "T1151",
      "planned": 833333.3333333334,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -833333.3333333334,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_18_18",
      "source_id": "source_6_Salaire Nov",
      "task_id": "T1181",
      "planned": 60000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -60000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_19_19",
      "source_id": "source_6_Salaire Nov",
      "task_id": "T1191",
      "planned": 62000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -62000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_20_20",
      "source_id": "source_6_Salaire Nov",
      "task_id": "T2261",
      "planned": 61200,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -61200,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_21_21",
      "source_id": "source_6_Salaire Nov",
      "task_id": "T2241",
      "planned": 75000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -75000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_22_22",
      "source_id": "source_6_Salaire Nov",
      "task_id": "T1112",
      "planned": 166666.66666666666,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -166666.66666666666,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.147Z",
      "updated_at": "2025-09-25T19:55:10.147Z"
    },
    {
      "id": "allocation_23_23",
      "source_id": "source_6_Salaire Nov",
      "task_id": "T3361",
      "planned": 100000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -100000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.148Z",
      "updated_at": "2025-09-25T19:55:10.148Z"
    },
    {
      "id": "allocation_24_24",
      "source_id": "source_7_Salaire Dev",
      "task_id": "T1151",
      "planned": 833333.3333333334,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -833333.3333333334,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.148Z",
      "updated_at": "2025-09-25T19:55:10.148Z"
    },
    {
      "id": "allocation_25_25",
      "source_id": "source_6_Salaire Nov",
      "task_id": "T1181",
      "planned": 60000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -60000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.148Z",
      "updated_at": "2025-09-25T19:55:10.148Z"
    },
    {
      "id": "allocation_26_26",
      "source_id": "source_6_Salaire Nov",
      "task_id": "T1191",
      "planned": 62000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -62000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.148Z",
      "updated_at": "2025-09-25T19:55:10.148Z"
    },
    {
      "id": "allocation_27_27",
      "source_id": "source_7_Salaire Dev",
      "task_id": "T2261",
      "planned": 61200,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -61200,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.148Z",
      "updated_at": "2025-09-25T19:55:10.148Z"
    },
    {
      "id": "allocation_28_28",
      "source_id": "source_7_Salaire Dev",
      "task_id": "T2241",
      "planned": 75000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -75000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.148Z",
      "updated_at": "2025-09-25T19:55:10.148Z"
    },
    {
      "id": "allocation_29_29",
      "source_id": "source_7_Salaire Dev",
      "task_id": "T2241",
      "planned": 75000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -75000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.148Z",
      "updated_at": "2025-09-25T19:55:10.148Z"
    },
    {
      "id": "allocation_30_30",
      "source_id": "source_7_Salaire Dev",
      "task_id": "T1112",
      "planned": 166666.66666666666,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -166666.66666666666,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.148Z",
      "updated_at": "2025-09-25T19:55:10.148Z"
    },
    {
      "id": "allocation_31_31",
      "source_id": "source_7_Salaire Dev",
      "task_id": "T3361",
      "planned": 100000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -100000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.148Z",
      "updated_at": "2025-09-25T19:55:10.148Z"
    },
    {
      "id": "allocation_32_32",
      "source_id": "source_7_Salaire Dev",
      "task_id": "T3331",
      "planned": 100000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -100000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.148Z",
      "updated_at": "2025-09-25T19:55:10.148Z"
    },
    {
      "id": "allocation_33_33",
      "source_id": "source_7_Salaire Dev",
      "task_id": "T3331",
      "planned": 100000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -100000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.148Z",
      "updated_at": "2025-09-25T19:55:10.148Z"
    },
    {
      "id": "allocation_34_34",
      "source_id": "source_7_Salaire Dev",
      "task_id": "T3331",
      "planned": 100000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -100000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.148Z",
      "updated_at": "2025-09-25T19:55:10.148Z"
    },
    {
      "id": "allocation_35_35",
      "source_id": "source_8_Tata Lucie Cotisation",
      "task_id": "T3331",
      "planned": 100000,
      "planned_date": null,
      "actual": 0,
      "actual_date": null,
      "month": null,
      "year": null,
      "variance": -100000,
      "status": "Planifié",
      "notes": "",
      "created_at": "2025-09-25T19:55:10.148Z",
      "updated_at": "2025-09-25T19:55:10.148Z"
    }
  ],
  "users": [
    {
      "id": 1,
      "full_name": "William KEMAJOU",
      "role": "Administrateur",
      "beneficiary_type": "Parent",
      "email": "william@famille.cm",
      "phone": "+237696123456",
      "birth_date": "1985-03-15",
      "family_relation": "Père",
      "allocation_priority": "Haute",
      "status": "Actif",
      "notes": "Responsable principal"
    },
    {
      "id": 2,
      "full_name": "Alix KEMAJOU",
      "role": "Administrateur",
      "beneficiary_type": "Parent",
      "email": "alix@famille.cm",
      "phone": "+237697654321",
      "birth_date": "1987-07-22",
      "family_relation": "Mère",
      "allocation_priority": "Haute",
      "status": "Actif",
      "notes": "Co-responsable"
    },
    {
      "id": 3,
      "full_name": "Uriel KEMAJOU",
      "role": "Bénéficiaire",
      "beneficiary_type": "Enfant",
      "email": "uriel@famille.cm",
      "phone": null,
      "birth_date": "2010-12-08",
      "family_relation": "Fils",
      "allocation_priority": "Critique",
      "status": "Actif",
      "notes": "Enfant aîné - Exposition artistique"
    },
    {
      "id": 4,
      "full_name": "Naelle KEMAJOU",
      "role": "Bénéficiaire",
      "beneficiary_type": "Enfant",
      "email": "naelle@famille.cm",
      "phone": null,
      "birth_date": "2013-04-18",
      "family_relation": "Fille",
      "allocation_priority": "Critique",
      "status": "Actif",
      "notes": "Piano et éducation"
    },
    {
      "id": 6,
      "full_name": "Tante Lucie",
      "role": "Contributeur",
      "beneficiary_type": "Famille étendue",
      "email": "lucie@famille.ch",
      "phone": "+41791234567",
      "birth_date": "1965-11-30",
      "family_relation": "Tante paternelle",
      "allocation_priority": "Moyenne",
      "status": "Actif",
      "notes": "Soutien depuis Suisse"
    }
  ],
  "kpis": {
    "active_projects": 4,
    "total_budget": 16722249,
    "total_used": 6322249,
    "average_progress": 51.8,
    "net_cash_flow": 118916.58,
    "overdue_tasks": 0,
    "net_worth": 37500000,
    "savings_rate": 22.5,
    "debt_to_income": 26.25,
    "avg_roi": 11.75,
    "avg_probability": 82.5,
    "project_velocity": 0.8,
    "budget_coverage": 87.3,
    "diversification_index": 0.75,
    "safety_margin": 42,
    "baby_step": 4
  },
  "monthly_data": [
    {
      "month": "2025-01",
      "needs": 400000,
      "allocations": 200000,
      "actual": 200000,
      "revenues": 800000,
      "balance": 600000,
      "active_tasks": 3
    },
    {
      "month": "2025-02",
      "needs": 0,
      "allocations": 0,
      "actual": 0,
      "revenues": 800000,
      "balance": 800000,
      "active_tasks": 2
    },
    {
      "month": "2025-03",
      "needs": 150000,
      "allocations": 150000,
      "actual": 0,
      "revenues": 800000,
      "balance": 650000,
      "active_tasks": 2
    },
    {
      "month": "2025-06",
      "needs": 2252280,
      "allocations": 2252280,
      "actual": 2252280,
      "revenues": 3232000,
      "balance": 979720,
      "active_tasks": 1
    },
    {
      "month": "2025-09",
      "needs": 150000,
      "allocations": 150000,
      "actual": 200000,
      "revenues": 1032000,
      "balance": 832000,
      "active_tasks": 2
    },
    {
      "month": "2025-10",
      "needs": 100000,
      "allocations": 100000,
      "actual": 0,
      "revenues": 1032000,
      "balance": 932000,
      "active_tasks": 2
    },
    {
      "month": "2025-11",
      "needs": 50000,
      "allocations": 50000,
      "actual": 0,
      "revenues": 1032000,
      "balance": 982000,
      "active_tasks": 1
    }
  ],
  "settings": {},
  "audit_log": [],
  "users": [
    {"id": 1, "full_name": "William KEMAJOU", "role": "Administrateur", "beneficiary_type": "Parent", "email": "william@famille.cm", "phone": "+237696123456", "birth_date": "1985-03-15", "family_relation": "Père", "allocation_priority": "Haute", "status": "Actif", "notes": "Responsable principal"},
    {"id": 2, "full_name": "Alix KEMAJOU", "role": "Administrateur", "beneficiary_type": "Parent", "email": "alix@famille.cm", "phone": "+237697654321", "birth_date": "1987-07-22", "family_relation": "Mère", "allocation_priority": "Haute", "status": "Actif", "notes": "Co-responsable"},
    {"id": 3, "full_name": "Uriel KEMAJOU", "role": "Bénéficiaire", "beneficiary_type": "Enfant", "email": "uriel@famille.cm", "phone": null, "birth_date": "2010-12-08", "family_relation": "Fils", "allocation_priority": "Critique", "status": "Actif", "notes": "Enfant aîné - Exposition artistique"},
    {"id": 4, "full_name": "Naelle KEMAJOU", "role": "Bénéficiaire", "beneficiary_type": "Enfant", "email": "naelle@famille.cm", "phone": null, "birth_date": "2013-04-18", "family_relation": "Fille", "allocation_priority": "Critique", "status": "Actif", "notes": "Piano et éducation"},
    {"id": 6, "full_name": "Tante Lucie", "role": "Contributeur", "beneficiary_type": "Famille étendue", "email": "lucie@famille.ch", "phone": "+41791234567", "birth_date": "1965-11-30", "family_relation": "Tante paternelle", "allocation_priority": "Moyenne", "status": "Actif", "notes": "Soutien depuis Suisse"}
  ],
  "monthly_data": [
    {"month": "2025-01", "needs": 400000, "allocations": 200000, "actual": 200000, "revenues": 800000, "balance": 600000, "active_tasks": 3},
    {"month": "2025-02", "needs": 0, "allocations": 0, "actual": 0, "revenues": 800000, "balance": 800000, "active_tasks": 2},
    {"month": "2025-03", "needs": 150000, "allocations": 150000, "actual": 0, "revenues": 800000, "balance": 650000, "active_tasks": 2},
    {"month": "2025-06", "needs": 2252280, "allocations": 2252280, "actual": 2252280, "revenues": 3232000, "balance": 979720, "active_tasks": 1},
    {"month": "2025-09", "needs": 150000, "allocations": 150000, "actual": 200000, "revenues": 1032000, "balance": 832000, "active_tasks": 2},
    {"month": "2025-10", "needs": 100000, "allocations": 100000, "actual": 0, "revenues": 1032000, "balance": 932000, "active_tasks": 2},
    {"month": "2025-11", "needs": 50000, "allocations": 50000, "actual": 0, "revenues": 1032000, "balance": 982000, "active_tasks": 1}
  ],
  "kpis": {
    "active_projects": 4,
    "total_budget": 16722249,
    "total_used": 6322249,
    "average_progress": 51.8,
    "net_cash_flow": 118916.58,
    "overdue_tasks": 0,
    "net_worth": 37500000,
    "savings_rate": 22.5,
    "debt_to_income": 26.25,
    "avg_roi": 11.75,
    "avg_probability": 82.5,
    "project_velocity": 0.8,
    "budget_coverage": 87.3,
    "diversification_index": 0.75,
    "safety_margin": 42.0,
    "baby_step": 4
  },
  "parameters": [
    {"category": "KPI_SEUILS", "parameter": "Couverture_Budgétaire_%", "value": 100, "description": "Seuil couverture budgétaire optimal"},
    {"category": "KPI_SEUILS", "parameter": "Taux_Épargne_%", "value": 20, "description": "Objectif taux épargne mensuel"},
    {"category": "KPI_SEUILS", "parameter": "Ratio_Endettement_%", "value": 35, "description": "Seuil maximum endettement/revenus"},
    {"category": "CALCULS", "parameter": "Taux_Actualisation_%", "value": 8, "description": "Taux pour calcul VAN/IRR"},
    {"category": "OBJECTIFS", "parameter": "Patrimoine_Cible_2030", "value": 50000000, "description": "Objectif patrimoine net 2030"}
  ],
  "audit_trail": [
    {"id": 1, "action": "CREATE", "entity": "Projet", "entity_id": 1, "user": "William", "timestamp": "2025-01-02T10:30:00", "details": "Création projet Titre foncier Mejeuh", "changes": "Nouveau projet avec budget 4.47M FCFA"},
    {"id": 2, "action": "UPDATE", "entity": "Allocation", "entity_id": 1, "user": "William", "timestamp": "2025-06-01T14:15:00", "details": "Allocation vente voiture vers voyage", "changes": "2M FCFA alloués"},
    {"id": 3, "action": "EXPORT", "entity": "Dashboard", "entity_id": null, "user": "Alix", "timestamp": "2025-09-15T09:45:00", "details": "Export données complètes", "changes": "Export Excel multi-onglets"},
    {"id": 4, "action": "UPDATE", "entity": "KPI", "entity_id": null, "user": "William", "timestamp": "2025-09-20T16:20:00", "details": "Mise à jour seuils KPI", "changes": "Taux épargne: 18% -> 20%"},
    {"id": 5, "action": "CREATE", "entity": "Tâche", "entity_id": 21, "user": "William", "timestamp": "2024-12-01T11:00:00", "details": "Ajout tâche plomberie", "changes": "Budget 800K FCFA, responsable William"}
  ]
};

let currentFilters = {
  month: '',
  year: '',
  category: '',
  status: ''
};

let charts = {};

// Vue Projets: état de tri et mode (liste/kanban)
let viewState = { projectsSort: 'name', kanban: false, sourcesSort: 'name' };

// KPI Formulas mapping
const kpiFormulas = {
  "Nombre de projets avec statut 'En cours' ou 'Planifié'": "Nombre de projets avec statut 'En cours' ou 'Planifié'",
  "Somme de tous les budgets des projets actifs": "Somme de tous les budgets des projets actifs",
  "Somme des montants alloués à tous les projets": "Somme des montants alloués à tous les projets",
  "Moyenne pondérée des progressions par budget": "Moyenne pondérée des progressions par budget",
  "Revenus - Dépenses courantes - Allocations": "Revenus - Dépenses courantes - Allocations",
  "Nombre de tâches avec date fin < aujourd'hui et statut != Terminé": "Nombre de tâches avec date fin < aujourd'hui et statut != Terminé",
  "Actifs totaux - Passifs totaux": "Actifs totaux - Passifs totaux",
  "(Revenus - Dépenses) / Revenus * 100": "(Revenus - Dépenses) / Revenus * 100",
  "Total dettes / Revenus mensuels * 100": "Total dettes / Revenus mensuels * 100",
  "Moyenne pondérée des ROI par montant investi": "Moyenne pondérée des ROI par montant investi",
  "Moyenne des probabilités de succès pondérée par budget": "Moyenne des probabilités de succès pondérée par budget",
  "Moyenne des progressions / Durée écoulée": "Moyenne des progressions / Durée écoulée"
};

// Centralized filter context
function getFilterContext(){
  const hasMonth = !!(currentFilters.month && /^\d{4}-\d{2}$/.test(currentFilters.month));
  const hasYear = !!(currentFilters.year && /^\d{4}$/.test(currentFilters.year));
  let start=null, end=null;
  if (hasMonth){
    const [y,m] = currentFilters.month.split('-').map(n=>parseInt(n,10));
    start = new Date(y, m-1, 1);
    end = new Date(y, m, 0);
  } else if (hasYear){
    const y = parseInt(currentFilters.year,10);
    start = new Date(y, 0, 1);
    end = new Date(y, 11, 31);
  }
  const ctx = { hasMonth, hasYear, monthStr: currentFilters.month||'', yearStr: currentFilters.year||'', start, end };
  try { console.log('[FilterContext]', ctx); } catch(e){}
  return ctx;
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0
  }).format(amount) + ' FCFA';
}

function formatPercentage(value) {
  return `${value.toFixed(1)}%`;
}

// RME helpers
function monthsDiffInclusive(fromDate, toDate) {
  try {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return 1;
    let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    if (to.getDate() < from.getDate()) months -= 1;
    months = Math.max(0, months);
    return months + 1;
  } catch (e) { return 1; }
}
function getTaskActualUsed(taskId) {
  try {
    return (appData.allocations || []).filter(a => a.task_id === taskId).reduce((s, a) => s + (Number(a.actual) || 0), 0);
  } catch (e) { return 0; }
}
function computeMonthlyRemaining(task) {
  if (!task) return 0;
  const budget = Number(task.budget) || 0;
  const actualUsed = getTaskActualUsed(task.id);
  const remaining = Math.max(0, budget - actualUsed);
  const now = new Date();
  const end = task.end_date ? new Date(task.end_date) : null;
  const months = end ? monthsDiffInclusive(now, end) : 1;
  return months > 0 ? Math.ceil(remaining / months) : remaining;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
}

function getStatusClass(status) {
  const statusMap = {
    'Terminé': 'completed',
    'En cours': 'in-progress', 
    'Planifié': 'planned',
    'Retard': 'delayed'
  };
  return statusMap[status] || 'planned';
}

function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 5000);
}

function addAuditEvent(action, entity, entityId, details, changes) {
  const newEvent = {
    id: appData.audit_trail.length + 1,
    action: action,
    entity: entity,
    entity_id: entityId,
    user: "William", // Would be current user in real app
    timestamp: new Date().toISOString(),
    details: details,
    changes: changes
  };
  appData.audit_trail.unshift(newEvent);
}

// Navigation - Fixed version
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.content-section');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  console.log('Navigation init - navLinks:', navLinks.length, 'sections:', sections.length);

  // Ensure sidebar is visible on desktop
  if (window.innerWidth > 1024) {
    sidebar.classList.remove('open');
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.dataset.section;
      console.log('Nav click:', sectionId);
      try { localStorage.setItem('app.fin.section', sectionId); } catch(e){}
      if (window.location.hash.slice(1) !== sectionId) {
        window.location.hash = sectionId;
      }
      
      // Update active nav link
      navLinks.forEach(nl => nl.classList.remove('active'));
      link.classList.add('active');
      
      // Show target section
      sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId) {
          section.classList.add('active');
          console.log('Showing section:', sectionId);
          // Render section content when switching
          renderSectionContent(sectionId);
        }
      });

      // Close sidebar on mobile
      if (window.innerWidth <= 1024) {
        sidebar.classList.remove('open');
      }
      
      showToast(`Navigation vers ${link.textContent.trim()}`, 'info');
    });
  });

  // Sidebar toggle for mobile/desktop
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
      console.log('Sidebar toggled, open:', sidebar.classList.contains('open'));
    });
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024 && 
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) && 
        !sidebarToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      sidebar.classList.remove('open');
    }
  });
}

// Render section content based on current section
function renderSectionContent(sectionId) {
  console.log('Rendering section:', sectionId);
  switch(sectionId) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'projects':
      if (viewState && viewState.kanban) { renderProjectsKanban(); } else { renderProjects(); }
      break;
    case 'sources':
      renderSources();
      break;
    case 'analyses':
      renderAnalyses();
      break;
    case 'comparisons':
      renderComparisonChart();
      break;
    case 'settings':
      renderSettings();
      break;
  }
}

// Persist and restore current section based on hash/localStorage
function loadCurrentSection() {
  let hash = (window.location.hash || '').slice(1);
  if (!hash) {
    try { hash = localStorage.getItem('app.fin.section') || 'dashboard'; } catch(e){ hash = 'dashboard'; }
  }
  const sections = document.querySelectorAll('.content-section');
  const navLinks = document.querySelectorAll('.nav-link');
  sections.forEach(s => s.classList.remove('active'));
  navLinks.forEach(l => l.classList.remove('active'));
  const section = document.querySelector(`section#${hash}`);
  if (section) {
    section.classList.add('active');
    const link = document.querySelector(`.nav-link[data-section="${hash}"]`);
    if (link) link.classList.add('active');
    try { localStorage.setItem('app.fin.section', hash); } catch(e){}
    renderSectionContent(hash);
  } else {
    renderDashboard();
  }
}

// Dark mode toggle
function initDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;
  
  if (!darkModeToggle) {
    console.log('Dark mode toggle not found');
    return;
  }
  
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  let currentTheme = 'light';
  if (savedTheme) {
    currentTheme = savedTheme;
  } else if (systemPrefersDark) {
    currentTheme = 'dark';
  }
  
  body.setAttribute('data-color-scheme', currentTheme);
  updateDarkModeIcon(currentTheme === 'dark');
  
  darkModeToggle.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-color-scheme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-color-scheme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateDarkModeIcon(newTheme === 'dark');
    
    showToast(`Mode ${newTheme === 'dark' ? 'sombre' : 'clair'} activé`, 'success');
    
    setTimeout(() => {
      Object.values(charts).forEach(chart => {
        if (chart && typeof chart.update === 'function') {
          chart.update();
        }
      });
    }, 100);
  });
}

function updateDarkModeIcon(isDark) {
  const icon = document.querySelector('#darkModeToggle i');
  if (icon) {
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  }
}

// Populate month dropdown dynamically
function populateMonthDropdown() {
  const monthFilter = document.getElementById('monthFilter');
  if (!monthFilter) return;
  
  // Get all unique month-year combinations from data
  const months = new Set();
  
  // From projects/tasks start_date and end_date
  (appData.projects || []).forEach(project => {
    if (project.start_date) {
      const date = new Date(project.start_date);
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    if (project.end_date) {
      const date = new Date(project.end_date);
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
  });
  
  // From sources availability_date
  (appData.sources || []).forEach(source => {
    if (source.availability_date) {
      const date = new Date(source.availability_date);
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
  });
  
  // From allocations planned_date and actual_date
  (appData.allocations || []).forEach(allocation => {
    if (allocation.planned_date) {
      const date = new Date(allocation.planned_date);
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    if (allocation.actual_date) {
      const date = new Date(allocation.actual_date);
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
  });
  
  // Sort months chronologically
  const sortedMonths = Array.from(months).sort();
  
  // Clear existing options
  monthFilter.innerHTML = '<option value="">Tous les mois</option>';
  
  // Add dynamic options - show "Mois Année" format
  sortedMonths.forEach(month => {
    const [year, monthNum] = month.split('-');
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const option = document.createElement('option');
    option.value = month; // Store as 'YYYY-MM' format
    option.textContent = `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    monthFilter.appendChild(option);
  });
  
  console.log('Month dropdown populated with:', sortedMonths);
}

// Apply quick date filters
function applyQuickDateFilter(filterType) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3);
  
  switch (filterType) {
    case 'this-month':
      currentFilters.startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      currentFilters.endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
      break;
    case 'this-quarter':
      const quarterStart = new Date(currentYear, currentQuarter * 3, 1);
      const quarterEnd = new Date(currentYear, (currentQuarter + 1) * 3, 0);
      currentFilters.startDate = quarterStart.toISOString().split('T')[0];
      currentFilters.endDate = quarterEnd.toISOString().split('T')[0];
      break;
    case 'this-year':
      currentFilters.startDate = new Date(currentYear, 0, 1).toISOString().split('T')[0];
      currentFilters.endDate = new Date(currentYear, 11, 31).toISOString().split('T')[0];
      break;
    case 'last-month':
      const lastMonth = new Date(currentYear, currentMonth - 1, 1);
      currentFilters.startDate = lastMonth.toISOString().split('T')[0];
      currentFilters.endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
      break;
    case 'last-quarter':
      const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
      const lastQuarterStart = new Date(currentYear, lastQuarter * 3, 1);
      const lastQuarterEnd = new Date(currentYear, (lastQuarter + 1) * 3, 0);
      currentFilters.startDate = lastQuarterStart.toISOString().split('T')[0];
      currentFilters.endDate = lastQuarterEnd.toISOString().split('T')[0];
      break;
    case 'last-year':
      currentFilters.startDate = new Date(currentYear - 1, 0, 1).toISOString().split('T')[0];
      currentFilters.endDate = new Date(currentYear - 1, 11, 31).toISOString().split('T')[0];
      break;
    default:
      currentFilters.startDate = '';
      currentFilters.endDate = '';
  }
}

// Filters - Modern version with quick date filters
function initFilters() {
  const quickDateFilter = document.getElementById('quickDateFilter');
  const customDateRange = document.getElementById('customDateRange');
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');
  const applyCustomRange = document.getElementById('applyCustomRange');
  const categoryFilter = document.getElementById('categoryFilter');
  const statusFilter = document.getElementById('statusFilter');
  const projectSearch = document.getElementById('projectSearch');
  
  console.log('Filters init - found elements:', {
    quickDateFilter: !!quickDateFilter,
    customDateRange: !!customDateRange,
    categoryFilter: !!categoryFilter,
    statusFilter: !!statusFilter,
    projectSearch: !!projectSearch
  });
  
  // Initialize quick date filter
  if (quickDateFilter) {
    quickDateFilter.addEventListener('change', (e) => {
      const value = e.target.value;
      currentFilters.quickDate = value;
      
      if (value === 'custom') {
        customDateRange.style.display = 'flex';
      } else {
        customDateRange.style.display = 'none';
        applyQuickDateFilter(value);
      }
      
      saveFiltersToStorage();
      applyFilters();
    });
  }
  
  // Initialize custom date range
  if (applyCustomRange) {
    applyCustomRange.addEventListener('click', () => {
      const start = startDate.value;
      const end = endDate.value;
      
      if (start && end) {
        currentFilters.startDate = start;
        currentFilters.endDate = end;
        saveFiltersToStorage();
        applyFilters();
      }
    });
  }
  
  try { loadFiltersFromStorage(); } catch(e){}
  
  // Set default values if no filters are stored
  if (!currentFilters.month) currentFilters.month = '';
  if (!currentFilters.year) currentFilters.year = '';
  if (!currentFilters.category) currentFilters.category = '';
  if (!currentFilters.status) currentFilters.status = '';
  if (!currentFilters.search) currentFilters.search = '';
  
  // Clean up corrupted filters
  if (currentFilters.month && (currentFilters.month.includes('00') || currentFilters.month.includes('2004-05'))) {
    console.log('Cleaning corrupted month filter:', currentFilters.month);
    currentFilters.month = '';
  }
  
  // Set filter values
  if (quickDateFilter) quickDateFilter.value = currentFilters.quickDate || '';
  if (categoryFilter) categoryFilter.value = currentFilters.category || '';
  if (statusFilter) statusFilter.value = currentFilters.status || '';
  if (projectSearch) projectSearch.value = currentFilters.search || '';
  try { updateFiltersBadge(); } catch(e){}

  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      currentFilters.category = e.target.value;
      applyFilters();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      currentFilters.status = e.target.value;
      applyFilters();
    });
  }

  if (projectSearch) {
    projectSearch.addEventListener('input', (e) => {
      currentFilters.search = e.target.value.toLowerCase();
      applyFilters();
    });
  }
}

function saveFiltersToStorage(){
  try { localStorage.setItem('app.fin.filters', JSON.stringify(currentFilters)); } catch(e){}
}
function loadFiltersFromStorage(){
  try {
    const s = localStorage.getItem('app.fin.filters');
    if (s){ 
      const f = JSON.parse(s); 
      if (f && typeof f === 'object') {
        // Validate and clean filter values
        if (f.month && f.month.includes('-') && f.month.split('-')[1] === '00') {
          // Invalid month format like '2025-00', reset to empty
          f.month = '';
        }
        if (f.month && f.month.includes('-') && f.month.split('-')[1] === '2004-05') {
          // Invalid month format like '2025-2004-05', reset to empty
          f.month = '';
        }
        Object.assign(currentFilters, f); 
      }
    }
  } catch(e){}
}
function countActiveFilters(){
  let n=0; if (currentFilters.month) n++; if (currentFilters.year) n++; if (currentFilters.category) n++; if (currentFilters.status) n++; if (currentFilters.search) n++; return n;
}
function updateFiltersBadge(){
  const n = countActiveFilters();
  let badge = document.getElementById('filtersActiveBadge');
  if (!badge){
    badge = document.createElement('span');
    badge.id='filtersActiveBadge';
    badge.className='badge';
    badge.style.marginLeft='8px';
    badge.style.background='#1FB8CD';
    badge.style.color='#fff';
    badge.style.padding='2px 6px';
    badge.style.borderRadius='10px';
    badge.style.fontSize='12px';
    const anchor = document.querySelector('.projects-filters') || document.querySelector('#sourcesControls') || document.querySelector('.filters-bar') || document.querySelector('#projects');
    (anchor||document.body).appendChild(badge);
  }
  if (n>0){ badge.textContent = `Filtres actifs (${n})`; badge.style.display='inline-block'; }
  else { if (badge) badge.style.display='none'; }
}

function applyFilters() {
  const activeSection = document.querySelector('.content-section.active');
  if (activeSection) {
    renderSectionContent(activeSection.id);
  }
  
  // Forcer la mise à jour des KPI et graphiques dans toutes les sections
  renderKPIs(); // Dashboard KPIs
  renderSourcesKPIs(); // Sources KPIs
  renderMonthlyChart(); // Dashboard monthly chart
  
  // Si on est sur la section sources, forcer le rafraîchissement
  if (activeSection && activeSection.id === 'sources') {
    renderSourcesChart();
  }
  
  try { saveFiltersToStorage(); } catch(e){}
  try { updateFiltersBadge(); } catch(e){}
  showToast('Filtres appliqués', 'success');
}

// Dashboard rendering
function renderDashboard() {
  console.log('Rendering dashboard...');
  renderKPIs();
  renderMonthlyChart();
  renderRecommendations();
  try { renderKpiEnhancements(); } catch (e) { console.warn('KPI enhancements failed', e); }
}

function renderKPIs() {
  // Recalculer les KPI avec les filtres appliqués si nécessaire
  let filteredProjects = appData.projects || [];
  let filteredSources = appData.sources || [];
  
  // Apply new date filters
  if (currentFilters.startDate && currentFilters.endDate) {
    const startDate = new Date(currentFilters.startDate);
    const endDate = new Date(currentFilters.endDate);
    
    // Filtrer les projets par date de début/fin
    filteredProjects = filteredProjects.filter(project => {
      if (!project.start_date && !project.end_date) return true;
      
      const projectStartDate = new Date(project.start_date || project.end_date);
      const projectEndDate = new Date(project.end_date || project.start_date);
      
      if (isNaN(projectStartDate.getTime()) || isNaN(projectEndDate.getTime())) {
        return true;
      }
      
      return (projectStartDate <= endDate && projectEndDate >= startDate);
    });
    
    // Filtrer les sources par date de disponibilité
    filteredSources = filteredSources.filter(source => {
      if (!source.availability_date) return true;
      
      const availDate = new Date(source.availability_date);
      return (availDate >= startDate && availDate <= endDate);
    });
  }

  // Recalculer les KPI avec les données filtrées
  const projects = filteredProjects.filter(p => p.parent_id === null);
  // Recalculer l'alloué réel via allocations filtrées
  let filteredAllocations = [...(appData.allocations||[])];
  
  // Apply new date filters to allocations
  if (currentFilters.startDate && currentFilters.endDate) {
    const startDate = new Date(currentFilters.startDate);
    const endDate = new Date(currentFilters.endDate);
    
    filteredAllocations = filteredAllocations.filter(allocation => {
      const allocationDate = new Date(allocation.planned_date || allocation.actual_date || allocation.month + '-01');
      return (allocationDate >= startDate && allocationDate <= endDate);
    });
  }
  const totalAllocatedFromAlloc = filteredAllocations.reduce((s,a)=> s + Math.max(a.planned||0, a.actual||0), 0);

  // Calculer les tâches actives (pas les projets)
  const activeTasks = filteredProjects.filter(p => p.parent_id !== null && (p.status === 'En cours' || p.status === 'Planifié'));
  
  // Calculer le budget total des projets
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  
  // Calculer la progression moyenne des tâches
  const tasks = filteredProjects.filter(p => p.parent_id !== null);
  const averageProgress = tasks.length > 0 ? tasks.reduce((sum, p) => sum + (p.progress || 0), 0) / tasks.length : 0;
  
  // Calculer le cash flow net
  const totalAvailable = filteredSources.reduce((sum, s) => sum + (s.available || 0), 0);
  const netCashFlow = totalAvailable - totalAllocatedFromAlloc;
  
  // Calculer les tâches en retard
  const overdueTasks = tasks.filter(p => p.end_date && new Date(p.end_date) < new Date() && p.status !== 'Terminé').length;
  
  // Calculer le taux d'épargne (simplifié)
  const savingsRate = totalAvailable > 0 ? (totalAllocatedFromAlloc / totalAvailable) * 100 : 0;
  
  // Calculer le ratio endettement (simplifié)
  const debtToIncome = totalBudget > 0 ? (totalAllocatedFromAlloc / totalBudget) * 100 : 0;
  
  // Calculer le ROI moyen
  const avgRoi = projects.length > 0 ? projects.reduce((sum, p) => sum + (p.roi || 0), 0) / projects.length : 0;
  
  // Calculer la probabilité moyenne des tâches
  const avgProbability = tasks.length > 0 ? tasks.reduce((sum, p) => sum + (p.probability || 0), 0) / tasks.length : 0;
  
  // Calculer la vélocité des projets
  const projectVelocity = projects.filter(p => p.status === 'Terminé').length;

  const recalculatedKpis = {
    active_projects: activeTasks.length,
    total_budget: totalBudget,
    total_used: totalAllocatedFromAlloc,
    average_progress: averageProgress,
    net_cash_flow: netCashFlow,
    overdue_tasks: overdueTasks,
    net_worth: totalAvailable,
    savings_rate: savingsRate,
    debt_to_income: debtToIncome,
    avg_roi: avgRoi,
    avg_probability: avgProbability,
    project_velocity: projectVelocity
  };

  const kpis = (currentFilters.startDate && currentFilters.endDate) ? recalculatedKpis : appData.kpis;
  console.log('Rendering KPIs:', kpis, 'Filtered:', !!(currentFilters.startDate && currentFilters.endDate));
  
  // Update all 12 KPI values
  const elements = {
    activeProjects: document.getElementById('activeProjects'),
    totalBudget: document.getElementById('totalBudget'), 
    totalUsed: document.getElementById('totalUsed'),
    avgProgress: document.getElementById('avgProgress'),
    netCashFlow: document.getElementById('netCashFlow'),
    overdueTasks: document.getElementById('overdueTasks'),
    netWorth: document.getElementById('netWorth'),
    savingsRate: document.getElementById('savingsRate'),
    debtRatio: document.getElementById('debtRatio'),
    avgRoi: document.getElementById('avgRoi'),
    avgProbability: document.getElementById('avgProbability'),
    projectVelocity: document.getElementById('projectVelocity')
  };

  // Log found elements
  Object.keys(elements).forEach(key => {
    console.log(`${key}: ${elements[key] ? 'found' : 'NOT FOUND'}`);
  });

  if (elements.activeProjects) {
    elements.activeProjects.textContent = kpis.active_projects;
    elements.activeProjects.title = `Formule: Tâches avec status "En cours" ou "Planifié"\nValeur: ${kpis.active_projects} tâches`;
  }
  if (elements.totalBudget) {
    elements.totalBudget.textContent = formatCurrency(kpis.total_budget);
    elements.totalBudget.title = `Formule: Somme des budgets des projets\nValeur: ${formatCurrency(kpis.total_budget)}`;
  }
  if (elements.totalUsed) {
    elements.totalUsed.textContent = formatCurrency(kpis.total_used);
    elements.totalUsed.title = `Formule: Somme des montants alloués\nValeur: ${formatCurrency(kpis.total_used)}`;
  }
  if (elements.avgProgress) {
    elements.avgProgress.textContent = formatPercentage(kpis.average_progress);
    elements.avgProgress.title = `Formule: Moyenne des progressions des tâches\nValeur: ${formatPercentage(kpis.average_progress)}`;
  }
  if (elements.netCashFlow) {
    elements.netCashFlow.textContent = formatCurrency(kpis.net_cash_flow);
    elements.netCashFlow.title = `Formule: Sources disponibles - Alloué\nValeur: ${formatCurrency(kpis.net_cash_flow)}`;
  }
  if (elements.overdueTasks) {
    elements.overdueTasks.textContent = kpis.overdue_tasks;
    elements.overdueTasks.title = `Formule: Tâches en retard (date < aujourd'hui)\nValeur: ${kpis.overdue_tasks} tâches`;
  }
  if (elements.netWorth) {
    elements.netWorth.textContent = formatCurrency(kpis.net_worth);
    elements.netWorth.title = `Formule: Somme des sources disponibles\nValeur: ${formatCurrency(kpis.net_worth)}`;
  }
  if (elements.savingsRate) {
    elements.savingsRate.textContent = formatPercentage(kpis.savings_rate);
    elements.savingsRate.title = `Formule: (Alloué / Sources disponibles) × 100\nValeur: ${formatPercentage(kpis.savings_rate)}`;
  }
  if (elements.debtRatio) {
    elements.debtRatio.textContent = formatPercentage(kpis.debt_to_income);
    elements.debtRatio.title = `Formule: (Alloué / Budget total) × 100\nValeur: ${formatPercentage(kpis.debt_to_income)}`;
  }
  if (elements.avgRoi) {
    elements.avgRoi.textContent = formatPercentage(kpis.avg_roi);
    elements.avgRoi.title = `Formule: Moyenne des ROI des projets\nValeur: ${formatPercentage(kpis.avg_roi)}`;
  }
  if (elements.avgProbability) {
    elements.avgProbability.textContent = formatPercentage(kpis.avg_probability);
    elements.avgProbability.title = `Formule: Moyenne des probabilités des tâches\nValeur: ${formatPercentage(kpis.avg_probability)}`;
  }
  if (elements.projectVelocity) {
    elements.projectVelocity.textContent = kpis.project_velocity.toFixed(1);
    elements.projectVelocity.title = `Formule: Nombre de projets terminés\nValeur: ${kpis.project_velocity.toFixed(1)} projets`;
  }
}

function renderMonthlyChart() {
  const ctx = document.getElementById('monthlyChart');
  if (!ctx) {
    console.log('Monthly chart canvas not found');
    return;
  }

  if (charts.monthly) {
    charts.monthly.destroy();
  }

  // Apply new date filters to monthly_data
  let data = [...(appData.monthly_data || [])];
  
  if (currentFilters.startDate && currentFilters.endDate) {
    const startDate = new Date(currentFilters.startDate);
    const endDate = new Date(currentFilters.endDate);
    
    data = data.filter(d => {
      const monthDate = new Date(d.month + '-01');
      return (monthDate >= startDate && monthDate <= endDate);
    });
  }
  
  charts.monthly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => {
        const date = new Date(d.month + '-01');
        return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      }),
      datasets: [
        {
          label: 'Besoins',
          data: data.map(d => d.needs / 1000000),
          backgroundColor: '#1FB8CD',
          borderColor: '#1FB8CD',
          borderWidth: 1
        },
        {
          label: 'Allocations',
          data: data.map(d => d.allocations / 1000000),
          backgroundColor: '#FFC185',
          borderColor: '#FFC185',
          borderWidth: 1
        },
        {
          label: 'Revenus',
          data: data.map(d => d.revenues / 1000000),
          backgroundColor: '#B4413C',
          borderColor: '#B4413C',
          borderWidth: 1
        },
        {
          label: 'Solde',
          type: 'line',
          data: data.map(d => d.balance / 1000000),
          borderColor: '#5D878F',
          backgroundColor: 'rgba(93, 135, 143, 0.1)',
          fill: false,
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Montant (M FCFA)'
          },
          position: 'left'
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Solde (M FCFA)'
          },
          grid: {
            drawOnChartArea: false,
          },
        },
        x: {
          title: {
            display: true,
            text: 'Mois'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Évolution Mensuelle - Besoins vs Allocations vs Revenus'
        },
        legend: {
          position: 'top'
        }
      }
    }
  });

  console.log('Monthly chart rendered successfully');
}

// KPI enhancements: gauges + sparklines + runway badge
function createOrUpdateGauge(anchorId, value, target, label){
  const anchor = document.getElementById(anchorId); if (!anchor) return;
  let wrap = anchor.parentElement.querySelector('.kpi-gauge');
  if (!wrap){
    wrap = document.createElement('div'); wrap.className='kpi-gauge';
    wrap.innerHTML = '<div class="gauge-label"></div><div class="gauge-track"><div class="gauge-fill"></div></div>';
    anchor.parentElement.appendChild(wrap);
  }
  const pct = Math.max(0, Math.min(100, value||0));
  const fill = wrap.querySelector('.gauge-fill'); const lbl = wrap.querySelector('.gauge-label');
  if (fill){ fill.style.width = pct + '%'; fill.style.height = '6px'; fill.style.backgroundColor = (target!=null && pct >= target) ? '#2E7D32' : '#F57C00'; }
  if (lbl){ lbl.textContent = (label||'') + ': ' + pct.toFixed(1) + '%' + (target!=null? ' / obj ' + target + '%' : ''); lbl.style.fontSize='12px'; lbl.style.marginBottom='4px'; }
}
function createSparkline(id, anchorEl, series, unit){
  if (!anchorEl) return;
  let canvas = anchorEl.parentElement.querySelector('#'+id);
  if (!canvas){ canvas = document.createElement('canvas'); canvas.id=id; canvas.height=30; canvas.style.marginTop='6px'; anchorEl.parentElement.appendChild(canvas); }
  try{
    if (!window._sparklines) window._sparklines = {};
    if (!window._sparklines[id]){
      window._sparklines[id] = new Chart(canvas, {
        type:'line',
        data:{ labels: series.map((_,i)=> i+1), datasets:[{ data: series, borderColor:'#5D878F', backgroundColor:'rgba(93,135,143,0.15)', fill:true, tension:0.3, pointRadius:0 }] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ display:false }, y:{ display:false } } }
      });
    } else {
      window._sparklines[id].data.datasets[0].data = series;
      window._sparklines[id].update();
    }
  }catch(e){ console.warn('sparkline failed', e); }
}
function renderKpiEnhancements(){
  try{
    const arr = (appData.monthly_data||[]).slice().sort((a,b)=> a.month.localeCompare(b.month));
    if (!arr.length) return;
    const last = arr[arr.length-1];
    const needs = last.needs||0; const allocPlanned = last.allocations||0; const allocActual = last.actual||0; const revenues = last.revenues||0;
    // Gauges
    const coverage = needs>0 ? (allocPlanned/needs*100) : 0;
    const savings = revenues>0 ? ((revenues - (allocActual||allocPlanned||0)) / revenues * 100) : 0;
    // Targets from parameters
    const getParam = (n, def)=>{ const p=(appData.parameters||[]).find(x=>x.parameter===n); return p? (typeof p.value==='string'? parseFloat(p.value): p.value): def; };
    const srTarget = parseFloat(getParam('Taux_Épargne_%', 20));
    createOrUpdateGauge('avgProgress', coverage, 100, 'Couverture');
    createOrUpdateGauge('savingsRate', savings, srTarget, 'Épargne (mensuel)');
    // Runway badge near netCashFlow
    const cfEl = document.getElementById('netCashFlow');
    if (cfEl){
      let badge = cfEl.parentElement.querySelector('.runway-badge');
      if (!badge){ badge = document.createElement('div'); badge.className='runway-badge'; cfEl.parentElement.appendChild(badge); }
      const cash = parseFloat(getParam('Cash_on_hand', getParam('Trésorerie', 0)))||0;
      const spend = allocActual||allocPlanned||0; const netNeeds = Math.max(1, needs - spend);
      const runway = cash>0 ? (cash / netNeeds) : 0;
      let label='🟢', color='#2E7D32'; if (runway<3){ label='🔴'; color='#D32F2F'; } else if (runway<6){ label='🟠'; color='#F57C00'; }
      badge.textContent = label + ' Runway: ' + runway.toFixed(1) + ' mois';
      badge.style.color = color; badge.style.fontSize='12px'; badge.style.marginTop='4px';
    }
    // Sparkline savingsRate désactivée volontairement (mise en page cassée). Nettoyage si existante.
    const oldSavingsCanvas = document.getElementById('spark-savings');
    if (oldSavingsCanvas){
      try {
        if (window._sparklines && window._sparklines['spark-savings']){
          window._sparklines['spark-savings'].destroy();
          delete window._sparklines['spark-savings'];
        }
      } catch(e) { /* ignore */ }
      oldSavingsCanvas.remove();
    }
    // Optionnel: conserver d'autres sparklines selon paramètre
    if (typeof getParamBool === 'function'){
      const last6 = arr.slice(-6);
      const balanceSeries = last6.map(m=> (m.balance||0)/1000000);
      if (getParamBool('KPI_Sparkline_Balance')) {
        createSparkline('spark-balance', document.getElementById('netCashFlow'), balanceSeries, 'M');
      }
    }
  }catch(e){ console.warn('renderKpiEnhancements failed', e); }
}

function renderRecommendations() {
  const recommendationsList = document.getElementById('recommendationsList');
  if (!recommendationsList) {
    console.log('Recommendations list not found');
    return;
  }

  const recommendations = [
    {
      type: 'warning',
      icon: 'fas fa-exclamation-triangle',
      title: 'Allocation dépassée',
      message: 'Le projet "Revenus IIBA" dépasse de 33.3% son allocation initiale (150K vs 200K FCFA).'
    },
    {
      type: 'success', 
      icon: 'fas fa-check-circle',
      title: 'Objectif atteint',
      message: 'Taux d\'épargne de 22.5% dépasse l\'objectif de 20%. Excellent travail!'
    },
    {
      type: 'info',
      icon: 'fas fa-lightbulb',
      title: 'Opportunité IA',
      message: 'ROI immobilier élevé (35%) détecté. Considérez augmenter l\'allocation au projet Bepanda.'
    },
    {
      type: 'info',
      icon: 'fas fa-chart-line',
      title: 'Diversification recommandée',
      message: 'Quadrant Investor à 30% des revenus. Objectif: atteindre 40% d\'ici fin 2025.'
    }
  ];

  recommendationsList.innerHTML = recommendations.map(rec => `
    <div class="recommendation-item ${rec.type}">
      <i class="${rec.icon}"></i>
      <div>
        <strong>${rec.title}:</strong> ${rec.message}
      </div>
    </div>
  `).join('');

  console.log('Recommendations rendered');
}

// Projects rendering
function renderProjects() {
  console.log('Rendering projects...');
  const container = document.getElementById('projectsContainer');
  if (!container) {
    console.log('Projects container not found');
    return;
  }

  // Get all tasks (children)
  let filteredTasks = appData.projects.filter(p => p.parent_id !== null);
  
  // Apply filters to tasks
  if (currentFilters.category) {
    filteredTasks = filteredTasks.filter(task => 
      task.category === currentFilters.category
    );
  }

  if (currentFilters.status) {
    filteredTasks = filteredTasks.filter(task => 
      task.status === currentFilters.status
    );
  }

  if (currentFilters.search) {
    filteredTasks = filteredTasks.filter(task => 
      task.name.toLowerCase().includes(currentFilters.search)
    );
  }
  
  // Apply date filters to tasks
  if (currentFilters.startDate && currentFilters.endDate) {
    const startDate = new Date(currentFilters.startDate);
    const endDate = new Date(currentFilters.endDate);
    
    filteredTasks = filteredTasks.filter(task => {
      if (!task.start_date && !task.end_date) return true;
      
      const taskStartDate = new Date(task.start_date || task.end_date);
      const taskEndDate = new Date(task.end_date || task.start_date);
      
      if (isNaN(taskStartDate.getTime()) || isNaN(taskEndDate.getTime())) {
        return true;
      }
      
      return (taskStartDate <= endDate && taskEndDate >= startDate);
    });
  }

  // Group tasks by their parent projects
  const tasksByProject = {};
  filteredTasks.forEach(task => {
    const parentId = task.parent_id;
    if (!tasksByProject[parentId]) {
      tasksByProject[parentId] = [];
    }
    tasksByProject[parentId].push(task);
  });

  // Get projects that have visible tasks
  const filteredProjects = appData.projects.filter(p => p.parent_id === null && tasksByProject[p.id]);

  // Note: Temporal filtering is applied to tasks only, not to parent projects
  // Projects are shown if they have at least one visible task after filtering

  // Inject controls (sort + kanban toggle)
  const projectsSection = document.getElementById('projects');
  const existingControls = document.getElementById('projectsControls');
  if (projectsSection && !existingControls) {
    const controls = document.createElement('div');
    controls.id = 'projectsControls';
    controls.className = 'list-controls';
    controls.style.display = 'flex';
    controls.style.alignItems = 'center';
    controls.style.gap = '8px';
    controls.style.margin = '8px 0';
    controls.innerHTML = `
      <label> Trier par:
        <select id="projectsSortSel" class="form-control" style="margin-left:6px;">
          <option value="name">Nom</option>
          <option value="progress">Progression</option>
          <option value="allocated">Alloué</option>
          <option value="deadline">Échéance</option>
        </select>
      </label>
      <button id="projectsToggleKanban" class="btn btn--secondary"><i class="fas fa-columns"></i> ${ (viewState && viewState.kanban) ? 'Vue Liste' : 'Vue Kanban' }</button>
    `;
    projectsSection.insertBefore(controls, container);
    const sel = document.getElementById('projectsSortSel');
    if (sel) { sel.value = (viewState && viewState.projectsSort) || 'name'; sel.onchange = (e)=>{ if (viewState) viewState.projectsSort = e.target.value; renderSectionContent('projects'); }; }
    const btn = document.getElementById('projectsToggleKanban');
    if (btn) { btn.onclick = ()=>{ if (viewState) viewState.kanban = !viewState.kanban; renderSectionContent('projects'); }; }
  } else {
    const btn = document.getElementById('projectsToggleKanban');
    if (btn) { btn.innerHTML = `<i class="fas fa-columns"></i> ${ (viewState && viewState.kanban) ? 'Vue Liste' : 'Vue Kanban' }`; }
    const sel = document.getElementById('projectsSortSel');
    if (sel && viewState) { sel.value = viewState.projectsSort || 'name'; }
  }

  // Add status line for projects and tasks
  const statusLine = document.getElementById('projectsStatusLine');
  if (statusLine) {
    statusLine.remove();
  }
  
  const statusDiv = document.createElement('div');
  statusDiv.id = 'projectsStatusLine';
  statusDiv.className = 'status-line';
  statusDiv.style.margin = '8px 0';
  statusDiv.style.padding = '8px';
  statusDiv.style.backgroundColor = 'var(--bg-secondary)';
  statusDiv.style.borderRadius = '4px';
  statusDiv.style.fontSize = '14px';
  statusDiv.style.color = 'var(--text-secondary)';
  
  // Count tasks
  const allTasks = appData.projects.filter(p => p.parent_id !== null);
  
  statusDiv.innerHTML = `
    <span>Projets: ${filteredProjects.length}/${appData.projects.filter(p => p.parent_id === null).length}</span>
    <span style="margin-left: 16px;">Tâches: ${filteredTasks.length}/${allTasks.length}</span>
  `;
  
  const controls = document.getElementById('projectsControls');
  if (controls && controls.parentNode) {
    controls.parentNode.insertBefore(statusDiv, controls.nextSibling);
  }

  // Apply sorting
  if (viewState && viewState.projectsSort) {
    switch(viewState.projectsSort) {
      case 'name': filteredProjects.sort((a,b)=> (a.name||'').localeCompare(b.name||'')); break;
      case 'progress': filteredProjects.sort((a,b)=> (b.progress||0) - (a.progress||0)); break;
      case 'allocated': filteredProjects.sort((a,b)=> (b.allocated||0) - (a.allocated||0)); break;
      case 'deadline': filteredProjects.sort((a,b)=> new Date(a.end_date||'2100-01-01') - new Date(b.end_date||'2100-01-01')); break;
    }
  }

  container.innerHTML = filteredProjects.map(project => {
    // Get filtered tasks for this project
    const projectTasks = tasksByProject[project.id] || [];
    const tasks = sortTasksIntelligently(projectTasks);
    
    return `
      <div class="project-item">
        <div class="project-header">
          <div class="project-info">
            <h3>
              ${project.name}
              <span class="project-id" style="font-size: 0.8em; color: #666; margin-left: 8px;">ID: ${project.id}</span>
            </h3>
            <div class="project-meta">
              <span><i class="fas fa-user"></i> ${project.responsible}</span>
              <span><i class="fas fa-calendar"></i> ${formatDate(project.start_date)} - ${formatDate(project.end_date)}</span>
              <span><i class="fas fa-tag"></i> ${project.category}</span>
              <span><i class="fas fa-star"></i> ${project.priority}</span>
              <span><i class="fas fa-percentage"></i> ${project.probability}% succès</span>
              <span class="task-status ${getStatusClass(project.status)}">${project.status}</span>
            </div>
          </div>
          <div class="project-actions">
            <button class="btn btn--sm btn--secondary" onclick="editProject('${project.id}')">
              <i class="fas fa-edit"></i> Éditer
            </button>
            <button class="btn btn--sm btn--danger" onclick="deleteProject('${project.id}')">
              <i class="fas fa-trash"></i> Supprimer
            </button>
            <button class="btn btn--sm btn--primary" onclick="openTaskModal(null, '${project.id}')">
              <i class="fas fa-plus"></i> Tâche
            </button>
          </div>
        </div>
        
        <div class="project-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${project.progress}%"></div>
          </div>
          <div class="progress-text">
            ${formatPercentage(project.progress)} - ${formatCurrency(project.allocated)} / ${formatCurrency(project.budget)}
            ${project.roi > 0 ? `• ROI: ${formatPercentage(project.roi)}` : ''}
          </div>
          <div class="project-finance-donut" title="Financement projet" style="margin-top:6px;display:flex;gap:6px;align-items:center;">
            ${renderFinanceDonutSVG((project.budget||0), (project.allocated||0))}
            <small>${formatCurrency(project.allocated||0)} / ${formatCurrency(project.budget||0)}</small>
          </div>
        </div>
        
        ${tasks.length > 0 ? `
          <div class="tasks-list">
            ${tasks.map(task => `
              <div class="task-item">
                <div class="task-info">
                  <div class="task-name">
                    ${task.name}
                    <span class="task-id" style="font-size: 0.8em; color: #666; margin-left: 8px;">ID: ${task.id}</span>
                  </div>
                  <div class="task-meta">
                    ${formatCurrency(task.allocated)} / ${formatCurrency(task.budget)} • 
                    ${task.responsible} • 
                    ${formatDate(task.start_date)} - ${formatDate(task.end_date)} • RME: ${formatCurrency(computeMonthlyRemaining(task))}/mois
                    ${task.notes ? ` • ${task.notes}` : ''}
                  </div>
                </div>
                <div class="task-actions">
                  <div class="task-finance-donut" title="Financement">
                    ${renderFinanceDonutSVG((task.budget||0), (task.allocated||0))}
                  </div>
                  <button class="btn btn--xs btn--secondary" onclick="editTask('${task.id}')" title="Éditer la tâche">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn--xs btn--danger" onclick="deleteTask('${task.id}')" title="Supprimer la tâche">
                    <i class="fas fa-trash"></i>
                  </button>
                  <div class="task-status ${getStatusClass(task.status)}">${task.status}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  const totalProjects = appData.projects.filter(p => p.parent_id === null).length;
  const totalTasks = appData.projects.filter(p => p.parent_id !== null).length;
  const visibleTasks = filteredProjects.reduce((count, project) => {
    const rawTasks = appData.projects.filter(p => p.parent_id === project.id);
    const filteredTasks = filterTasksByCurrentPeriod(rawTasks);
    return count + filteredTasks.length;
  }, 0);
  
  // Add counters display
  const countersContainer = document.getElementById('projectsCounters');
  if (countersContainer) {
    countersContainer.innerHTML = `
      <div class="counters-display" style="display: flex; gap: 20px; margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 14px;">
        <div><strong>Projets:</strong> ${filteredProjects.length}/${totalProjects}</div>
        <div><strong>Tâches:</strong> ${visibleTasks}/${totalTasks}</div>
        <div><strong>Filtres actifs:</strong> ${currentFilters.month || currentFilters.year || currentFilters.category || currentFilters.status ? 'Oui' : 'Non'}</div>
      </div>
    `;
  }
  
  if (filteredProjects.length < totalProjects) {
    showToast(`${filteredProjects.length}/${totalProjects} projets affichés`, 'info');
  }

  console.log(`Rendered ${filteredProjects.length} projects`);
}

// Small inline donut SVG renderer for financing completion
function renderFinanceDonutSVG(total, allocated){
  const t = Number(total)||0; const a = Math.min(Number(allocated)||0, t);
  const pct = t>0 ? (a/t) : 0;
  const size=24, stroke=4, radius=(size-stroke)/2, cx=size/2, cy=size/2, c=2*Math.PI*radius;
  const off = c*(1-pct);
  const color = pct>=1 ? '#2E7D32' : (pct>=0.5 ? '#F57C00' : '#D32F2F');
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle cx="${cx}" cy="${cy}" r="${radius}" stroke="#e5e7eb" stroke-width="${stroke}" fill="none"></circle>
      <circle cx="${cx}" cy="${cy}" r="${radius}" stroke="${color}" stroke-width="${stroke}" fill="none"
              stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" stroke-linecap="round"
              transform="rotate(-90 ${cx} ${cy})"></circle>
    </svg>`;
}

// Sources rendering
function renderProjectsKanban() {
  console.log('Rendering projects Kanban...');
  const container = document.getElementById('projectsContainer');
  if (!container) { console.log('Projects container not found'); return; }

  // Build tasks array (children only)
  let tasks = appData.projects.filter(p => p.parent_id !== null);

  // Apply filters similar to list view
  if (currentFilters.category) {
    tasks = tasks.filter(t => t.category === currentFilters.category || (appData.projects.find(p=>p.id===t.parent_id)?.category === currentFilters.category));
  }
  if (currentFilters.status) {
    tasks = tasks.filter(t => t.status === currentFilters.status);
  }
  if (currentFilters.search) {
    tasks = tasks.filter(t => (t.name||'').toLowerCase().includes(currentFilters.search));
  }
  
  // Apply new date filters
  if (currentFilters.startDate && currentFilters.endDate) {
    const startDate = new Date(currentFilters.startDate);
    const endDate = new Date(currentFilters.endDate);
    
    tasks = tasks.filter(task => {
      if (!task.start_date && !task.end_date) return true;
      
      const taskStartDate = new Date(task.start_date || task.end_date);
      const taskEndDate = new Date(task.end_date || task.start_date);
      
      if (isNaN(taskStartDate.getTime()) || isNaN(taskEndDate.getTime())) {
        return true;
      }
      
      return (taskStartDate <= endDate && taskEndDate >= startDate);
    });
  }

  const cols = [
    { key: 'Planifié', label: 'Planifié' },
    { key: 'En cours', label: 'En cours' },
    { key: 'Retard', label: 'Retard' },
    { key: 'Terminé', label: 'Terminé' }
  ];

  const boardHtml = cols.map(col => {
    const itemsHtml = tasks.filter(t => t.status === col.key).map(t => {
      const rme = computeMonthlyRemaining(t);
      const parent = appData.projects.find(p=>p.id===t.parent_id);
      return (
        '<div class="kanban-card">'
          + '<div class="kc-title">'+ (t.name||'') +'</div>'
          + '<div class="kc-meta">'+ formatCurrency(t.allocated||0) +' / '+ formatCurrency(t.budget||0) +' • '+ (t.responsible||'') +'</div>'
          + '<div class="kc-meta">'+ formatDate(t.start_date) +' - '+ formatDate(t.end_date) +' • RME: '+ formatCurrency(rme) +'/mois</div>'
          + (parent ? '<div class="kc-parent">↳ '+ parent.name +'</div>' : '')
        + '</div>'
      );
    }).join('');
    const count = tasks.filter(t=>t.status===col.key).length;
    return (
      '<div class="kanban-column" data-status="'+col.key+'">'
        + '<div class="kc-header">'+ col.label +' ('+ count +')</div>'
        + '<div class="kc-body">'+ itemsHtml +'</div>'
      + '</div>'
    );
  }).join('');

  container.innerHTML = '<div class="kanban-board">' + boardHtml + '</div>';

  // Minimal inline styles
  try {
    let style = document.getElementById('kanbanInlineStyle');
    if (!style) {
      style = document.createElement('style'); style.id='kanbanInlineStyle';
      style.textContent =
        '.kanban-board{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}' +
        '.kanban-column{background:var(--card-bg,#fff);border:1px solid rgba(0,0,0,0.08);border-radius:8px;min-height:120px;display:flex;flex-direction:column;}' +
        '.kc-header{padding:8px 10px;font-weight:600;border-bottom:1px solid rgba(0,0,0,0.06);}' +
        '.kc-body{padding:8px;display:flex;flex-direction:column;gap:8px;}' +
        '.kanban-card{background:rgba(31,184,205,0.06);border:1px solid rgba(31,184,205,0.2);border-radius:6px;padding:8px;}' +
        '.kc-title{font-weight:600;margin-bottom:4px;}' +
        '.kc-meta{font-size:12px;color:#5D878F;margin-bottom:2px;}' +
        '.kc-parent{font-size:11px;color:#777;margin-top:2px;}';
      document.head.appendChild(style);
    }
  } catch(e) {}
}

function renderSources() {
  console.log('Rendering sources...');

  // Build and sort sources according to viewState, then apply filters
  let sources = [...(appData.sources||[])];
  const fc = getFilterContext();
  
  // Apply new date filters
  if (currentFilters.startDate && currentFilters.endDate) {
    const startDate = new Date(currentFilters.startDate);
    const endDate = new Date(currentFilters.endDate);
    
    sources = sources.filter(source => {
      // Si une source n'a pas de date de disponibilité, on l'inclut quand même
      if (!source.availability_date) {
        console.log(`Source "${source.name}" sans date de disponibilité - incluse par défaut`);
        return true;
      }
      
      const availDate = new Date(source.availability_date);
      return (availDate <= endDate && availDate >= startDate);
    });
  }
  
  // Ensuite trier les sources filtrées
  const sortBy = (viewState && viewState.sourcesSort) || 'name';
  switch (sortBy) {
    case 'name': sources.sort((a,b)=> (a.name||'').localeCompare(b.name||'')); break;
    case 'available': sources.sort((a,b)=> (b.available||0) - (a.available||0)); break;
    case 'remaining': sources.sort((a,b)=> (b.remaining||0) - (a.remaining||0)); break;
    case 'allocation_rate': sources.sort((a,b)=> (b.allocation_rate||0) - (a.allocation_rate||0)); break;
    case 'availability_date': sources.sort((a,b)=> new Date(a.availability_date||'2100-01-01') - new Date(b.availability_date||'2100-01-01')); break;
  }
  window.__sortedSources = sources;

  // Inject controls (sort)
  const section = document.getElementById('sources');
  if (section && !document.getElementById('sourcesControls')) {
    const controls = document.createElement('div');
    controls.id = 'sourcesControls';
    controls.className = 'list-controls';
    controls.style.display = 'flex';
    controls.style.alignItems = 'center';
    controls.style.gap = '8px';
    controls.style.margin = '8px 0';
    controls.innerHTML = `
      <label> Trier par:
        <select id="sourcesSortSel" class="form-control" style="margin-left:6px;">
          <option value="name">Nom</option>
          <option value="available">Disponible</option>
          <option value="remaining">Restant</option>
          <option value="allocation_rate">Taux d'allocation</option>
          <option value="availability_date">Date disponible</option>
        </select>
      </label>
    `;
    const header = section.querySelector('h2, h3, .section-title');
    if (header && header.parentNode) header.insertAdjacentElement('afterend', controls); else section.insertBefore(controls, section.firstChild);
    const sel = document.getElementById('sourcesSortSel');
    if (sel) { sel.value = sortBy; sel.onchange = (e)=>{ if (viewState) viewState.sourcesSort = e.target.value; renderSources(); } }
  } else {
    const sel = document.getElementById('sourcesSortSel'); if (sel) sel.value = sortBy;
  }

  // Add status line for sources and allocations
  const statusLine = document.getElementById('sourcesStatusLine');
  if (statusLine) {
    statusLine.remove();
  }
  
  const statusDiv = document.createElement('div');
  statusDiv.id = 'sourcesStatusLine';
  statusDiv.className = 'status-line';
  statusDiv.style.margin = '8px 0';
  statusDiv.style.padding = '8px';
  statusDiv.style.backgroundColor = 'var(--bg-secondary)';
  statusDiv.style.borderRadius = '4px';
  statusDiv.style.fontSize = '14px';
  statusDiv.style.color = 'var(--text-secondary)';
  
  // Count allocations
  let filteredAllocations = [...(appData.allocations||[])];
  if (currentFilters.startDate && currentFilters.endDate) {
    const startDate = new Date(currentFilters.startDate);
    const endDate = new Date(currentFilters.endDate);
    
    filteredAllocations = filteredAllocations.filter(allocation => {
      const allocationDate = new Date(allocation.planned_date || allocation.actual_date || allocation.month + '-01');
      return (allocationDate >= startDate && allocationDate <= endDate);
    });
  }
  
  statusDiv.innerHTML = `
    <span>Sources: ${sources.length}/${appData.sources?.length || 0}</span>
    <span style="margin-left: 16px;">Allocations: ${filteredAllocations.length}/${appData.allocations?.length || 0}</span>
  `;
  
  const controls = document.getElementById('sourcesControls');
  if (controls && controls.parentNode) {
    controls.parentNode.insertBefore(statusDiv, controls.nextSibling);
  }

  renderSourcesTable();
  renderSourcesChart();
  renderSourcesKPIs(); // Ajouter la mise à jour des KPI
  renderAllocationsTable();
}

function renderSourcesTable() {
  const tbody = document.getElementById('sourcesTableBody');
  if (!tbody) {
    console.log('Sources table body not found');
    return;
  }

  const data = (window.__sortedSources || appData.sources || []);
  tbody.innerHTML = data.map(source => `
    <tr>
      <td>
        <strong>${source.name}</strong>
        <div style="font-size:12px;color:#5D878F">
          ID: ${source.id} • Dispo: ${formatDate(source.availability_date)}
        </div>
      </td>
      <td><span class="status--info">${source.type}</span></td>
      <td>${formatCurrency(source.available)}</td>
      <td>${formatCurrency(source.allocated)}</td>
      <td class="${source.remaining < 0 ? 'text-red' : 'text-green'}">
        ${formatCurrency(source.remaining)}
      </td>
      <td>
        <span class="${source.allocation_rate > 100 ? 'text-red' : 'text-blue'}">
          ${formatPercentage(source.allocation_rate)}
        </span>
      </td>
      <td><strong>${source.responsible}</strong></td>
      <td>
        <div style="display:flex;gap:4px;align-items:center;">
          <button class="btn btn--sm btn--secondary" onclick="editSource('${source.id}')" title="Éditer">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn--sm btn--primary" onclick="allocateSource('${source.id}')" title="Allouer">
            <i class="fas fa-plus"></i>
          </button>
          <button class="btn btn--sm btn--danger" onclick="deleteSource('${source.id}')" title="Supprimer" style="background-color:#dc3545;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  console.log('Sources table rendered');
}

function renderSourcesChart() {
  const ctx = document.getElementById('sourcesChart');
  if (!ctx) {
    console.log('Sources chart canvas not found');
    return;
  }

  if (charts.sources) {
    charts.sources.destroy();
  }

  // Apply new date filters
  let sources = appData.sources || [];
  
  if (currentFilters.startDate && currentFilters.endDate) {
    const startDate = new Date(currentFilters.startDate);
    const endDate = new Date(currentFilters.endDate);
    
    sources = sources.filter(source => {
      // Si une source n'a pas de date de disponibilité, on l'inclut quand même
      if (!source.availability_date) return true;
      
      const availDate = new Date(source.availability_date);
      return (availDate >= startDate && availDate <= endDate);
    });
  }

  charts.sources = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: sources.map(s => s.name),
      datasets: [{
        data: sources.map(s => Math.abs(s.allocated)),
        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Répartition des Sources'
        },
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  console.log('Sources chart rendered');
}

function renderSourcesKPIs() {
  // Calculer les totaux des sources avec filtres appliqués
  let sources = appData.sources || [];
  
  // Apply new date filters
  if (currentFilters.startDate && currentFilters.endDate) {
    const startDate = new Date(currentFilters.startDate);
    const endDate = new Date(currentFilters.endDate);
    
    sources = sources.filter(source => {
      // Si une source n'a pas de date de disponibilité, on l'inclut quand même
      if (!source.availability_date) return true;
      
      const availDate = new Date(source.availability_date);
      return (availDate >= startDate && availDate <= endDate);
    });
  }
  
  // Recalculer l'alloué à partir des allocations filtrées au même périmètre
  let filteredAllocations = [...(appData.allocations||[])];
  
  // Apply new date filters to allocations
  if (currentFilters.startDate && currentFilters.endDate) {
    const startDate = new Date(currentFilters.startDate);
    const endDate = new Date(currentFilters.endDate);
    
    filteredAllocations = filteredAllocations.filter(allocation => {
      const allocationDate = new Date(allocation.planned_date || allocation.actual_date || allocation.month + '-01');
      return (allocationDate >= startDate && allocationDate <= endDate);
    });
  }

  const allocatedBySource = filteredAllocations.reduce((map,a)=>{
    const amt = Math.max(a.planned||0, a.actual||0);
    map[a.source_id] = (map[a.source_id]||0) + amt;
    return map;
  }, {});

  const totals = sources.reduce((acc, source) => {
    acc.available += (source.available || 0);
    const calcAllocated = allocatedBySource[source.id] || 0;
    acc.allocated += calcAllocated;
    return acc;
  }, { available: 0, allocated: 0 });

  const remaining = totals.available - totals.allocated;
  const allocationRate = totals.available > 0 ? (totals.allocated / totals.available) * 100 : 0;

  // Calculer les KPIs détaillés par mois
  let availableThisMonth = 0;
  let availablePreviousMonths = 0;
  let allocatedThisMonth = 0;
  let allocatedPreviousMonths = 0;
  
  if (currentFilters.startDate && currentFilters.endDate) {
    const startDate = new Date(currentFilters.startDate);
    const endDate = new Date(currentFilters.endDate);
    
    // Calculer les montants disponibles par période
    sources.forEach(source => {
      if (source.availability_date) {
        const availDate = new Date(source.availability_date);
        if (availDate >= startDate && availDate <= endDate) {
          availableThisMonth += (source.available || 0);
        } else if (availDate < startDate) {
          availablePreviousMonths += (source.available || 0);
        }
      }
    });
    
    // Calculer les montants alloués par période
    filteredAllocations.forEach(allocation => {
      const allocationDate = new Date(allocation.planned_date || allocation.actual_date || allocation.month + '-01');
      const amount = Math.max(allocation.planned || 0, allocation.actual || 0);
      
      if (allocationDate >= startDate && allocationDate <= endDate) {
        allocatedThisMonth += amount;
      } else if (allocationDate < startDate) {
        allocatedPreviousMonths += amount;
      }
    });
  }
  
  // Calculer les restants
  const remainingThisMonth = Math.max(0, availableThisMonth - allocatedThisMonth);
  const remainingPreviousMonths = Math.max(0, availablePreviousMonths - allocatedPreviousMonths);

  // Mettre à jour les éléments DOM
  const elements = {
    totalAvailable: document.getElementById('totalAvailable'),
    totalAllocated: document.getElementById('totalAllocated'),
    totalRemaining: document.getElementById('totalRemaining'),
    allocationRate: document.getElementById('allocationRate'),
    availableThisMonth: document.getElementById('availableThisMonth'),
    allocatedThisMonth: document.getElementById('allocatedThisMonth'),
    remainingThisMonth: document.getElementById('remainingThisMonth'),
    availablePreviousMonths: document.getElementById('availablePreviousMonths'),
    remainingPreviousMonths: document.getElementById('remainingPreviousMonths')
  };

  if (elements.totalAvailable) elements.totalAvailable.textContent = formatCurrency(totals.available);
  if (elements.totalAllocated) elements.totalAllocated.textContent = formatCurrency(totals.allocated);
  if (elements.totalRemaining) elements.totalRemaining.textContent = formatCurrency(remaining);
  if (elements.allocationRate) elements.allocationRate.textContent = formatPercentage(allocationRate);
  
  // Afficher les KPIs détaillés si on filtre par mois
  const cards = {
    availableThisMonth: document.getElementById('availableThisMonthCard'),
    allocatedThisMonth: document.getElementById('allocatedThisMonthCard'),
    remainingThisMonth: document.getElementById('remainingThisMonthCard'),
    availablePreviousMonths: document.getElementById('availablePreviousMonthsCard'),
    remainingPreviousMonths: document.getElementById('remainingPreviousMonthsCard')
  };
  
  if (currentFilters.startDate && currentFilters.endDate) {
    // Mettre à jour les valeurs
    if (elements.availableThisMonth) elements.availableThisMonth.textContent = formatCurrency(availableThisMonth);
    if (elements.allocatedThisMonth) elements.allocatedThisMonth.textContent = formatCurrency(allocatedThisMonth);
    if (elements.remainingThisMonth) elements.remainingThisMonth.textContent = formatCurrency(remainingThisMonth);
    if (elements.availablePreviousMonths) elements.availablePreviousMonths.textContent = formatCurrency(availablePreviousMonths);
    if (elements.remainingPreviousMonths) elements.remainingPreviousMonths.textContent = formatCurrency(remainingPreviousMonths);
    
    // Afficher les cartes
    Object.values(cards).forEach(card => {
      if (card) card.style.display = 'block';
    });
  } else {
    // Masquer les cartes
    Object.values(cards).forEach(card => {
      if (card) card.style.display = 'none';
    });
  }

  // Mettre à jour le graphique de résumé
  const ctxSummary = document.getElementById('sourcesChartSummary');
  if (ctxSummary) {
    if (charts.sourcesSummary) {
      charts.sourcesSummary.destroy();
    }

    const sourcesWithAllocations = sources.filter(s => (allocatedBySource[s.id]||0) > 0);
    if (sourcesWithAllocations.length > 0) {
      charts.sourcesSummary = new Chart(ctxSummary, {
        type: 'doughnut',
        data: {
          labels: sourcesWithAllocations.map(s => s.name),
          datasets: [{
            data: sourcesWithAllocations.map(s => Math.abs(allocatedBySource[s.id]||0)),
            backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }
  }

  console.log('Sources KPIs rendered');
}

function renderAllocationsTable() {
  const tbody = document.getElementById('allocationsTableBody');
  if (!tbody) {
    console.log('Allocations table body not found');
    return;
  }

  let filteredAllocations = [...appData.allocations];
  
  // Apply new date filters
  if (currentFilters.startDate && currentFilters.endDate) {
    const startDate = new Date(currentFilters.startDate);
    const endDate = new Date(currentFilters.endDate);
    
    filteredAllocations = filteredAllocations.filter(allocation => {
      const allocationDate = new Date(allocation.planned_date || allocation.actual_date || allocation.month + '-01');
      return (allocationDate >= startDate && allocationDate <= endDate);
    });
  }

  tbody.innerHTML = filteredAllocations.map(allocation => {
    const variancePercentage = allocation.planned !== 0 ? 
      Math.abs((allocation.variance / allocation.planned) * 100) : 0;
    
    // Get source and task names
    const source = appData.sources.find(s => s.id === allocation.source_id);
    const task = appData.projects.find(p => p.id === allocation.task_id);
    const sourceName = source ? source.name : 'Source inconnue';
    const taskName = task ? task.name : 'Tâche inconnue';
    
    return `
      <tr>
        <td>${allocation.month}</td>
        <td>
          <strong>${sourceName}</strong>
          <div style="font-size:12px;color:#5D878F">ID: ${allocation.source_id}</div>
        </td>
        <td>
          ${taskName}
          <div style="font-size:12px;color:#5D878F">Task ID: ${allocation.task_id}</div>
        </td>
        <td>${formatCurrency(allocation.planned)}</td>
        <td>${formatCurrency(allocation.actual)}</td>
        <td class="${allocation.variance < 0 ? 'text-red' : 'text-green'}">
          ${formatCurrency(allocation.variance)} 
          ${variancePercentage > 10 ? 
            `<i class="fas fa-exclamation-triangle text-warning" title="Écart > 10%"></i>` : ''}
          <br><small>(${formatPercentage(variancePercentage)})</small>
        </td>
        <td><strong>${allocation.allocation_responsible}</strong></td>
        <td>
          <span class="task-status ${getStatusClass(allocation.status)}">
            ${allocation.status}
          </span>
        </td>
        <td>
          <div style="display:flex;gap:4px;align-items:center;">
            <button class="btn btn--sm btn--secondary" onclick="editAllocation('${allocation.id}')" title="Éditer">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn--sm btn--danger" onclick="deleteAllocation('${allocation.id}')" title="Supprimer" style="background-color:#dc3545;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  console.log('Allocations table rendered');
  try { initAllocationsVirtualization(); } catch(e){}
}

// Allocation helpers: strict mode + live deltas + virtualization
function getParamBool(name){
  try { const p=(appData.parameters||[]).find(x=>x.parameter===name); if (!p) return false; const v=p.value; return v===true || v==='true' || v===1 || v==='1'; } catch(e){ return false; }
}
function getParamValue(name, def){ try{ const p=(appData.parameters||[]).find(x=>x.parameter===name); if (!p) return def; const v=p.value; const n=(typeof v==='string')? parseFloat(v) : v; return (isNaN(n)? v : n); }catch(e){ return def; } }
function setParamValue(name, value, category){ try{ let p=(appData.parameters||[]).find(x=>x.parameter===name); if (p){ p.value = value; } else { (appData.parameters=appData.parameters||[]).push({ category: category||'CONFIG', parameter:name, value, description:'' }); } }catch(e){} }
function attachAllocationInteractions(src){
  const form = document.getElementById('allocationForm');
  if (!form) return;
  const plannedEl = document.getElementById('allocationPlannedAmount');
  const actualEl = document.getElementById('allocationActualAmount');
  const pDeltaEl = document.getElementById('allocationPlannedDelta');
  const aDeltaEl = document.getElementById('allocationActualDelta');
  const taskSel = document.getElementById('allocationTaskSelect');
  const modal = document.getElementById('newAllocationModal');
  const editingId = modal?.dataset.editingId ? parseInt(modal.dataset.editingId) : null;

  // Recalcule l'alloué de base pour la source, en retirant l'ancienne allocation si on édite
  const allAllocations = (appData.allocations||[]).filter(a=>a.source_id===src.id);
  const currentAllocated = allAllocations.reduce((s,a)=> s + Math.max(a.planned||0, a.actual||0), 0);
  let baseAllocated = currentAllocated;
  if (editingId) {
    const oldAllocation = (appData.allocations||[]).find(a=>a.id===editingId);
    const oldAmount = oldAllocation ? Math.max(oldAllocation.planned||0, oldAllocation.actual||0) : 0;
    baseAllocated = Math.max(0, currentAllocated - oldAmount);
  }

  const updateDeltas = ()=>{
    try{
      const taskId = parseInt(taskSel?.value||'0');
      const task = (appData.projects||[]).find(p=>p.id===taskId);
      const srcRem = Math.max(0, (src?.available||0) - baseAllocated);
      const taskRem = task ? Math.max(0, (task.budget||0) - (task.allocated||0)) : 0;
      const planned = parseFloat(plannedEl?.value||'0')||0;
      const actual = parseFloat(actualEl?.value||'0')||0;
      const predicted = Math.max(planned, actual);
      const predictedAllocated = baseAllocated + predicted;
      const predictedRemaining = Math.max(0, (src?.available||0) - predictedAllocated);
      if (pDeltaEl) pDeltaEl.textContent = `alloué actuel: ${formatCurrency(baseAllocated)} • alloué prévu: ${formatCurrency(predictedAllocated)} • restant prévu: ${formatCurrency(predictedRemaining)}`;
      if (aDeltaEl) aDeltaEl.textContent = `alloué actuel: ${formatCurrency(baseAllocated)} • alloué prévu: ${formatCurrency(predictedAllocated)} • restant prévu: ${formatCurrency(predictedRemaining)}`;
      // Color feedback if exceed
      const overPlanned = planned>srcRem || planned>taskRem;
      const overActual = actual>srcRem || actual>taskRem;
      if (plannedEl) plannedEl.style.borderColor = overPlanned? '#D32F2F' : '';
      if (actualEl) actualEl.style.borderColor = overActual? '#D32F2F' : '';
      // Delta color badges
      const setDeltaColor = (el, over)=>{ if (!el) return; el.style.color = over? '#D32F2F' : (predicted>0? '#F57C00' : ''); };
      setDeltaColor(pDeltaEl, overPlanned);
      setDeltaColor(aDeltaEl, overActual);

      // Live update of modal summary (predictive after input)
      const modalRemEl = document.getElementById('modalRemaining');
      const modalUsedRateEl = document.getElementById('modalUsedRate');
      if (modalRemEl) modalRemEl.textContent = formatCurrency(predictedRemaining);
      if (modalUsedRateEl) {
        const rate = (src?.available||0) > 0 ? (predictedAllocated / (src.available||1)) * 100 : 0;
        modalUsedRateEl.textContent = `${rate.toFixed(1)}%`;
      }

      // Mini récap au-dessus du bouton Allouer
      let recap = document.getElementById('allocationImpactRecap');
      if (!recap && form) {
        recap = document.createElement('div');
        recap.id = 'allocationImpactRecap';
        recap.style.fontSize = '12px';
        recap.style.marginTop = '6px';
        recap.style.padding = '6px 8px';
        recap.style.border = '1px solid rgba(0,0,0,0.1)';
        recap.style.borderRadius = '6px';
        form.appendChild(recap);
      }
      if (recap) {
        const warn = (overPlanned || overActual);
        recap.style.color = warn ? '#D32F2F' : '#1565C0';
        recap.style.background = warn ? 'rgba(211, 47, 47, 0.06)' : 'rgba(21, 101, 192, 0.06)';
        recap.textContent = warn
          ? `Attention: montant dépasse la capacité (source ${formatCurrency(srcRem)}, tâche ${formatCurrency(taskRem)}).`
          : `Impact: alloué prévu ${formatCurrency(predictedAllocated)} • restant prévu ${formatCurrency(predictedRemaining)}`;
      }

      // Recap côté tâche (budget, alloué actuel, restant prévu)
      let taskRecap = document.getElementById('taskImpactRecap');
      if (!taskRecap && form) {
        taskRecap = document.createElement('div');
        taskRecap.id = 'taskImpactRecap';
        taskRecap.style.fontSize = '12px';
        taskRecap.style.marginTop = '6px';
        form.appendChild(taskRecap);
      }
      if (taskRecap) {
        if (task) {
          // Recalculer l'alloué actuel de la tâche (hors ancienne allocation en mode édition)
          const taskAllocs = (appData.allocations||[]).filter(a=>a.task_id===task.id);
          const taskCurrentAllocated = taskAllocs.reduce((s,a)=> s + Math.max(a.planned||0, a.actual||0), 0);
          let taskBaseAllocated = taskCurrentAllocated;
          if (editingId) {
            const oldAllocation = (appData.allocations||[]).find(a=>a.id===editingId);
            const oldAmt = oldAllocation ? Math.max(oldAllocation.planned||0, oldAllocation.actual||0) : 0;
            if (oldAllocation && oldAllocation.task_id === task.id) taskBaseAllocated = Math.max(0, taskCurrentAllocated - oldAmt);
          }
          const taskPredictedAllocated = taskBaseAllocated + predicted;
          const taskRemainingPred = Math.max(0, (task.budget||0) - taskPredictedAllocated);
          taskRecap.textContent = `Tâche: budget ${formatCurrency(task.budget||0)} • alloué actuel ${formatCurrency(taskBaseAllocated)} • restant prévu ${formatCurrency(taskRemainingPred)}`;
          taskRecap.style.color = taskRemainingPred===0 ? '#2E7D32' : '#5D878F';
        } else {
          taskRecap.textContent = '';
        }
      }
    }catch(e){}
  };
  if (plannedEl) plannedEl.oninput = updateDeltas;
  if (actualEl) actualEl.oninput = updateDeltas;
  if (taskSel) taskSel.onchange = updateDeltas;
  updateDeltas();

  form.onsubmit = (e)=>{
    try{
      const strict = getParamBool('Mode_Strict_Allocations');
      if (!strict) return true;
      const planned = parseFloat(plannedEl?.value||'0')||0;
      const actual = parseFloat(actualEl?.value||'0')||0;
      const taskId = parseInt(taskSel?.value||'0')||null;
      const task = (appData.projects||[]).find(p=>p.id===taskId);
      const srcRem = Math.max(0, (src?.available||0) - (src?.allocated||0));
      const taskRem = task ? Math.max(0, (task.budget||0) - (task.allocated||0)) : 0;
      const over = (planned>0 && (planned>srcRem || planned>taskRem)) || (actual>0 && (actual>srcRem || actual>taskRem));
      if (over){ e.preventDefault(); e.stopPropagation(); showToast('Mode strict: montant dépasse source ou tâche restante', 'error'); return false; }
      return true;
    }catch(err){ console.error(err); return true; }
  };
}

function initAllocationsVirtualization(){
  try{
    const tbody = document.getElementById('allocationsTableBody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length <= 100) return;
    const keep = rows.slice(0,100);
    const pending = rows.slice(100);
    tbody.innerHTML = '';
    keep.forEach(r=>tbody.appendChild(r));
    const section = document.querySelector('#sources .allocations-section') || document.getElementById('sources');
    if (!section) return;
    let sentinel = document.getElementById('allocationsSentinel');
    if (!sentinel){ sentinel = document.createElement('div'); sentinel.id='allocationsSentinel'; sentinel.style.height='1px'; section.appendChild(sentinel); }
    const io = new IntersectionObserver(entries=>{
      if (entries.some(e=>e.isIntersecting)){
        for (let i=0; i<50 && pending.length; i++) tbody.appendChild(pending.shift());
        if (pending.length===0){ try{ io.disconnect(); }catch(e){} try{ sentinel.remove(); }catch(e){} showToast('Toutes les allocations chargées', 'info'); }
      }
    }, { root:null, rootMargin:'600px 0px', threshold:0});
    io.observe(sentinel);
  }catch(e){ console.warn('initAllocationsVirtualization failed', e); }
}

// Expert analyses
function initAnalyses() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      
      tabBtns.forEach(tb => tb.classList.remove('active'));
      btn.classList.add('active');
      
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTab) {
          content.classList.add('active');
        }
      });

      showToast(`Analyse ${targetTab.toUpperCase()} affichée`, 'info');
    });
  });
}

function renderAnalyses() {
  console.log('Rendering analyses...');
  
  // Apply filters to get filtered data
  let filteredProjects = appData.projects || [];
  let filteredSources = appData.sources || [];
  let filteredAllocations = appData.allocations || [];
  
  if (currentFilters.startDate && currentFilters.endDate) {
    const startDate = new Date(currentFilters.startDate);
    const endDate = new Date(currentFilters.endDate);
    
    // Filter projects
    filteredProjects = filteredProjects.filter(project => {
      if (!project.start_date && !project.end_date) return true;
      const projectStartDate = new Date(project.start_date || project.end_date);
      const projectEndDate = new Date(project.end_date || project.start_date);
      if (isNaN(projectStartDate.getTime()) || isNaN(projectEndDate.getTime())) return true;
      return (projectStartDate <= endDate && projectEndDate >= startDate);
    });
    
    // Filter sources
    filteredSources = filteredSources.filter(source => {
      if (!source.availability_date) return true;
      const availDate = new Date(source.availability_date);
      return (availDate >= startDate && availDate <= endDate);
    });
    
    // Filter allocations
    filteredAllocations = filteredAllocations.filter(allocation => {
      const allocationDate = new Date(allocation.planned_date || allocation.actual_date || allocation.month + '-01');
      return (allocationDate >= startDate && allocationDate <= endDate);
    });
  }
  
  // Calculate Kiyosaki analysis
  const kiyosakiData = calculateKiyosakiAnalysis(filteredProjects);
  updateKiyosakiDisplay(kiyosakiData);
  
  // Calculate Buffet analysis
  const buffetData = calculateBuffetAnalysis(filteredProjects, filteredSources);
  updateBuffetDisplay(buffetData);
  
  // Calculate Ramsey analysis
  const ramseyData = calculateRamseyAnalysis(filteredProjects, filteredSources);
  updateRamseyDisplay(ramseyData);
  
  // Calculate Family Canvas analysis
  const familyCanvasData = calculateFamilyCanvasAnalysis(filteredProjects, filteredSources);
  updateFamilyCanvasDisplay(familyCanvasData);
}

function calculateKiyosakiAnalysis(projects) {
  const types = {
    'Employee': 0,
    'Self-Employed': 0,
    'Business': 0,
    'Investor': 0
  };
  
  projects.forEach(project => {
    const kiyosakiType = project.kiyosaki_type || 'Actif générateur';
    const budget = project.budget || 0;
    
    // Map Kiyosaki types to quadrants
    if (kiyosakiType === 'Actif générateur') {
      types['Employee'] += budget;
    } else if (kiyosakiType === 'Actif spéculatif') {
      types['Self-Employed'] += budget;
    } else if (kiyosakiType === 'Passif') {
      types['Business'] += budget;
    } else if (kiyosakiType === 'Dépense') {
      types['Investor'] += budget;
    }
  });
  
  return types;
}

function updateKiyosakiDisplay(data) {
  // Update the existing quadrant values
  const employeeValue = document.querySelector('#kiyosaki .quadrant-item.employee .quadrant-value');
  const selfEmployedValue = document.querySelector('#kiyosaki .quadrant-item.self-employed .quadrant-value');
  const businessValue = document.querySelector('#kiyosaki .quadrant-item.business .quadrant-value');
  const investorValue = document.querySelector('#kiyosaki .quadrant-item.investor .quadrant-value');
  
  if (employeeValue) {
    employeeValue.textContent = formatCurrency(data['Employee'] || 0);
    employeeValue.title = `Formule: Somme des budgets des projets "Actif générateur"\nValeur: ${formatCurrency(data['Employee'] || 0)}`;
  }
  if (selfEmployedValue) {
    selfEmployedValue.textContent = formatCurrency(data['Self-Employed'] || 0);
    selfEmployedValue.title = `Formule: Somme des budgets des projets "Actif spéculatif"\nValeur: ${formatCurrency(data['Self-Employed'] || 0)}`;
  }
  if (businessValue) {
    businessValue.textContent = formatCurrency(data['Business'] || 0);
    businessValue.title = `Formule: Somme des budgets des projets "Passif"\nValeur: ${formatCurrency(data['Business'] || 0)}`;
  }
  if (investorValue) {
    investorValue.textContent = formatCurrency(data['Investor'] || 0);
    investorValue.title = `Formule: Somme des budgets des projets "Dépense"\nValeur: ${formatCurrency(data['Investor'] || 0)}`;
  }
  
  // Update recommendation based on values
  const recommendation = document.querySelector('#kiyosaki .analysis-recommendation');
  if (recommendation) {
    const total = data['Employee'] + data['Self-Employed'] + data['Business'] + data['Investor'];
    const employeePercent = total > 0 ? (data['Employee'] / total) * 100 : 0;
    const investorPercent = total > 0 ? (data['Investor'] / total) * 100 : 0;
    
    let recText = '';
    if (employeePercent > 80) {
      recText = '⚠️ Trop dépendant du salariat (E). Développez les quadrants S, B, I pour diversifier vos revenus.';
    } else if (investorPercent > 40) {
      recText = '✅ Excellent équilibre! Vous avez une bonne diversification des revenus.';
    } else if (investorPercent < 20) {
      recText = '🎯 Objectif: Augmenter le quadrant I (Investisseur) à 40% des revenus totaux.';
    } else {
      recText = '📈 Continuez à développer les revenus passifs (quadrant I) pour votre liberté financière.';
    }
    
    recommendation.innerHTML = `<strong>Recommandation IA:</strong> ${recText}`;
  }
}

function calculateBuffetAnalysis(projects, sources) {
  const totalValue = sources.reduce((sum, s) => sum + (s.available || 0), 0);
  const totalAllocated = projects.reduce((sum, p) => sum + (p.allocated || 0), 0);
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  
  // Calculate IRR (simplified)
  const roi = projects.length > 0 ? projects.reduce((sum, p) => sum + (p.roi || 0), 0) / projects.length : 0;
  const irr = roi; // Simplified IRR calculation
  
  // Calculate Payback Period
  const paybackPeriod = totalAllocated > 0 ? (totalBudget / totalAllocated) * 12 : 0;
  
  // Calculate NPV
  const npv = totalValue - totalAllocated;
  
  return {
    totalValue,
    totalAllocated,
    totalBudget,
    roi,
    irr,
    paybackPeriod,
    npv,
    allocationRate: totalValue > 0 ? (totalAllocated / totalValue) * 100 : 0
  };
}

function updateBuffetDisplay(data) {
  // Update the existing Buffett metrics
  const irrValue = document.querySelector('#buffett .metric-card:nth-child(1) .metric-value');
  const paybackValue = document.querySelector('#buffett .metric-card:nth-child(2) .metric-value');
  const npvValue = document.querySelector('#buffett .metric-card:nth-child(3) .metric-value');
  const roiValue = document.querySelector('#buffett .metric-card:nth-child(4) .metric-value');
  
  if (irrValue) {
    irrValue.textContent = `${data.irr.toFixed(1)}%`;
    irrValue.title = `Formule: ROI moyen des projets\nValeur: ${data.irr.toFixed(1)}%`;
  }
  if (paybackValue) {
    paybackValue.textContent = `${data.paybackPeriod.toFixed(1)} mois`;
    paybackValue.title = `Formule: (Budget total / Alloué) × 12\nValeur: ${data.paybackPeriod.toFixed(1)} mois`;
  }
  if (npvValue) {
    npvValue.textContent = formatCurrency(data.npv);
    npvValue.title = `Formule: Valeur totale - Alloué\nValeur: ${formatCurrency(data.npv)}`;
  }
  if (roiValue) {
    roiValue.textContent = `${data.allocationRate.toFixed(1)}%`;
    roiValue.title = `Formule: (Alloué / Valeur totale) × 100\nValeur: ${data.allocationRate.toFixed(1)}%`;
  }
  
  // Update recommendation
  const recommendation = document.querySelector('#buffett .analysis-recommendation');
  if (recommendation) {
    let recText = '';
    if (data.irr > 15) {
      recText = '✅ Excellent rendement! Vos investissements sont très performants.';
    } else if (data.irr > 10) {
      recText = '📈 Bon rendement. Continuez à optimiser vos investissements.';
    } else if (data.irr > 5) {
      recText = '⚠️ Rendement moyen. Revisitez vos stratégies d\'investissement.';
    } else {
      recText = '🚨 Rendement faible. Diversifiez et optimisez vos investissements.';
    }
    
    recommendation.innerHTML = `<strong>Recommandation IA:</strong> ${recText}`;
  }
}

function calculateRamseyAnalysis(projects, sources) {
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalAllocated = projects.reduce((sum, p) => sum + (p.allocated || 0), 0);
  const totalValue = sources.reduce((sum, s) => sum + (s.available || 0), 0);
  
  // Calculate emergency fund (3-6 months of expenses)
  const emergencyFund = sources.filter(s => s.type === 'Fond d\'urgence' || s.name.toLowerCase().includes('urgence')).reduce((sum, s) => sum + (s.available || 0), 0);
  
  // Calculate debt ratio
  const debtRatio = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;
  
  // Calculate expense ratio
  const expenseRatio = totalValue > 0 ? (totalAllocated / totalValue) * 100 : 0;
  
  // Calculate Baby Steps progression
  const babySteps = {
    step1: emergencyFund > 0 ? 100 : 0, // Emergency fund
    step2: debtRatio < 50 ? 100 : 0, // Debt payoff
    step3: emergencyFund > totalAllocated * 3 ? 100 : 0, // 3-6 months emergency
    step4: expenseRatio < 25 ? 100 : 0, // 15% retirement
    step5: expenseRatio < 20 ? 100 : 0, // College fund
    step6: expenseRatio < 15 ? 100 : 0, // Pay off home
    step7: expenseRatio < 10 ? 100 : 0 // Build wealth
  };
  
  return {
    totalBudget,
    totalAllocated,
    totalValue,
    emergencyFund,
    debtRatio,
    expenseRatio,
    babySteps
  };
}

function updateRamseyDisplay(data) {
  // Update the existing Ramsey metrics
  const emergencyValue = document.querySelector('#ramsey .metric-card:nth-child(1) .metric-value');
  const debtValue = document.querySelector('#ramsey .metric-card:nth-child(2) .metric-value');
  const budgetValue = document.querySelector('#ramsey .metric-card:nth-child(3) .metric-value');
  const allocatedValue = document.querySelector('#ramsey .metric-card:nth-child(4) .metric-value');
  
  if (emergencyValue) {
    emergencyValue.textContent = formatCurrency(data.emergencyFund);
    emergencyValue.title = `Formule: Somme des sources "Fond d'urgence"\nValeur: ${formatCurrency(data.emergencyFund)}`;
  }
  if (debtValue) {
    debtValue.textContent = `${data.debtRatio.toFixed(1)}%`;
    debtValue.title = `Formule: (Alloué / Budget total) × 100\nValeur: ${data.debtRatio.toFixed(1)}%`;
  }
  if (budgetValue) {
    budgetValue.textContent = formatCurrency(data.totalBudget);
    budgetValue.title = `Formule: Somme des budgets des projets\nValeur: ${formatCurrency(data.totalBudget)}`;
  }
  if (allocatedValue) {
    allocatedValue.textContent = formatCurrency(data.totalAllocated);
    allocatedValue.title = `Formule: Somme des montants alloués\nValeur: ${formatCurrency(data.totalAllocated)}`;
  }
  
  // Update Baby Steps progression (simplified)
  const babyStepsContainer = document.querySelector('#ramsey .baby-steps');
  if (!babyStepsContainer) {
    // Create Baby Steps container if it doesn't exist
    const ramseySection = document.querySelector('#ramsey');
    if (ramseySection) {
      const newContainer = document.createElement('div');
      newContainer.className = 'baby-steps';
      newContainer.style.marginTop = '20px';
      newContainer.style.padding = '16px';
      newContainer.style.backgroundColor = 'var(--bg-secondary)';
      newContainer.style.borderRadius = '8px';
      ramseySection.appendChild(newContainer);
    }
  }
  
  if (babyStepsContainer) {
    const steps = Object.values(data.babySteps);
    const completedSteps = steps.filter(step => step === 100).length;
    const totalSteps = steps.length;
    const progress = (completedSteps / totalSteps) * 100;
    
    babyStepsContainer.innerHTML = `
      <div class="baby-steps-progress">
        <h4>Progression Baby Steps: ${completedSteps}/${totalSteps} (${progress.toFixed(0)}%)</h4>
        <div class="steps-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin-top: 12px;">
          <div class="step ${data.babySteps.step1 === 100 ? 'completed' : ''}" style="padding: 8px; border-radius: 4px; background: ${data.babySteps.step1 === 100 ? '#d4edda' : '#f8d7da'}; border: 1px solid ${data.babySteps.step1 === 100 ? '#c3e6cb' : '#f5c6cb'};">
            <strong>1. Emergency Fund</strong><br>
            <small>${data.babySteps.step1 === 100 ? '✅ Complété' : '❌ À faire'}</small>
          </div>
          <div class="step ${data.babySteps.step2 === 100 ? 'completed' : ''}" style="padding: 8px; border-radius: 4px; background: ${data.babySteps.step2 === 100 ? '#d4edda' : '#f8d7da'}; border: 1px solid ${data.babySteps.step2 === 100 ? '#c3e6cb' : '#f5c6cb'};">
            <strong>2. Debt Payoff</strong><br>
            <small>${data.babySteps.step2 === 100 ? '✅ Complété' : '❌ À faire'}</small>
          </div>
          <div class="step ${data.babySteps.step3 === 100 ? 'completed' : ''}" style="padding: 8px; border-radius: 4px; background: ${data.babySteps.step3 === 100 ? '#d4edda' : '#f8d7da'}; border: 1px solid ${data.babySteps.step3 === 100 ? '#c3e6cb' : '#f5c6cb'};">
            <strong>3. 3-6 Months Emergency</strong><br>
            <small>${data.babySteps.step3 === 100 ? '✅ Complété' : '❌ À faire'}</small>
          </div>
          <div class="step ${data.babySteps.step4 === 100 ? 'completed' : ''}" style="padding: 8px; border-radius: 4px; background: ${data.babySteps.step4 === 100 ? '#d4edda' : '#f8d7da'}; border: 1px solid ${data.babySteps.step4 === 100 ? '#c3e6cb' : '#f5c6cb'};">
            <strong>4. 15% Retirement</strong><br>
            <small>${data.babySteps.step4 === 100 ? '✅ Complété' : '❌ À faire'}</small>
          </div>
          <div class="step ${data.babySteps.step5 === 100 ? 'completed' : ''}" style="padding: 8px; border-radius: 4px; background: ${data.babySteps.step5 === 100 ? '#d4edda' : '#f8d7da'}; border: 1px solid ${data.babySteps.step5 === 100 ? '#c3e6cb' : '#f5c6cb'};">
            <strong>5. College Fund</strong><br>
            <small>${data.babySteps.step5 === 100 ? '✅ Complété' : '❌ À faire'}</small>
          </div>
          <div class="step ${data.babySteps.step6 === 100 ? 'completed' : ''}" style="padding: 8px; border-radius: 4px; background: ${data.babySteps.step6 === 100 ? '#d4edda' : '#f8d7da'}; border: 1px solid ${data.babySteps.step6 === 100 ? '#c3e6cb' : '#f5c6cb'};">
            <strong>6. Pay Off Home</strong><br>
            <small>${data.babySteps.step6 === 100 ? '✅ Complété' : '❌ À faire'}</small>
          </div>
          <div class="step ${data.babySteps.step7 === 100 ? 'completed' : ''}" style="padding: 8px; border-radius: 4px; background: ${data.babySteps.step7 === 100 ? '#d4edda' : '#f8d7da'}; border: 1px solid ${data.babySteps.step7 === 100 ? '#c3e6cb' : '#f5c6cb'};">
            <strong>7. Build Wealth</strong><br>
            <small>${data.babySteps.step7 === 100 ? '✅ Complété' : '❌ À faire'}</small>
          </div>
        </div>
      </div>
    `;
  }
  
  // Update recommendation
  const recommendation = document.querySelector('#ramsey .analysis-recommendation');
  if (recommendation) {
    let recText = '';
    if (data.babySteps.step1 === 0) {
      recText = '🚨 Étape 1: Créez un fond d\'urgence de 1000€ immédiatement!';
    } else if (data.babySteps.step2 === 0) {
      recText = '📉 Étape 2: Concentrez-vous sur le remboursement de vos dettes.';
    } else if (data.babySteps.step3 === 0) {
      recText = '💰 Étape 3: Augmentez votre fond d\'urgence à 3-6 mois de dépenses.';
    } else if (data.babySteps.step4 === 0) {
      recText = '🏦 Étape 4: Investissez 15% de vos revenus pour la retraite.';
    } else {
      recText = '🎯 Excellent! Vous progressez bien dans les Baby Steps de Dave Ramsey.';
    }
    
    recommendation.innerHTML = `<strong>Recommandation IA:</strong> ${recText}`;
  }
}

function calculateFamilyCanvasAnalysis(projects, sources) {
  const totalValue = sources.reduce((sum, s) => sum + (s.available || 0), 0);
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalAllocated = projects.reduce((sum, p) => sum + (p.allocated || 0), 0);
  const completionRate = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;
  
  // Calculate family financial health metrics
  const emergencyRatio = totalValue > 0 ? (sources.filter(s => s.type === 'Fond d\'urgence').reduce((sum, s) => sum + (s.available || 0), 0) / totalValue) * 100 : 0;
  const debtRatio = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;
  const savingsRate = totalValue > 0 ? ((totalValue - totalAllocated) / totalValue) * 100 : 0;
  
  // Calculate family canvas quadrants
  const quadrants = {
    valueProposition: completionRate, // Value creation
    keyPartners: emergencyRatio, // Financial security
    keyActivities: debtRatio, // Debt management
    keyResources: savingsRate // Resource optimization
  };
  
  return {
    totalValue,
    totalBudget,
    totalAllocated,
    completionRate,
    emergencyRatio,
    debtRatio,
    savingsRate,
    quadrants
  };
}

function updateFamilyCanvasDisplay(data) {
  // Update the existing Family Canvas metrics
  const valueValue = document.querySelector('#canvas .metric-card:nth-child(1) .metric-value');
  const budgetValue = document.querySelector('#canvas .metric-card:nth-child(2) .metric-value');
  const allocatedValue = document.querySelector('#canvas .metric-card:nth-child(3) .metric-value');
  const completionValue = document.querySelector('#canvas .metric-card:nth-child(4) .metric-value');
  
  if (valueValue) {
    valueValue.textContent = formatCurrency(data.totalValue);
    valueValue.title = `Formule: Somme des sources disponibles\nValeur: ${formatCurrency(data.totalValue)}`;
  }
  if (budgetValue) {
    budgetValue.textContent = formatCurrency(data.totalBudget);
    budgetValue.title = `Formule: Somme des budgets des projets\nValeur: ${formatCurrency(data.totalBudget)}`;
  }
  if (allocatedValue) {
    allocatedValue.textContent = formatCurrency(data.totalAllocated);
    allocatedValue.title = `Formule: Somme des montants alloués\nValeur: ${formatCurrency(data.totalAllocated)}`;
  }
  if (completionValue) {
    completionValue.textContent = `${data.completionRate.toFixed(1)}%`;
    completionValue.title = `Formule: (Alloué / Budget total) × 100\nValeur: ${data.completionRate.toFixed(1)}%`;
  }
  
  // Update Family Canvas quadrants
  const canvasContainer = document.querySelector('#canvas .family-canvas');
  if (canvasContainer) {
    canvasContainer.innerHTML = `
      <div class="canvas-grid">
        <div class="canvas-quadrant">
          <h4>Value Proposition</h4>
          <div class="quadrant-value">${data.quadrants.valueProposition.toFixed(1)}%</div>
          <p>Création de valeur</p>
        </div>
        <div class="canvas-quadrant">
          <h4>Key Partners</h4>
          <div class="quadrant-value">${data.quadrants.keyPartners.toFixed(1)}%</div>
          <p>Sécurité financière</p>
        </div>
        <div class="canvas-quadrant">
          <h4>Key Activities</h4>
          <div class="quadrant-value">${data.quadrants.keyActivities.toFixed(1)}%</div>
          <p>Gestion des dettes</p>
        </div>
        <div class="canvas-quadrant">
          <h4>Key Resources</h4>
          <div class="quadrant-value">${data.quadrants.keyResources.toFixed(1)}%</div>
          <p>Optimisation des ressources</p>
        </div>
      </div>
    `;
  }
  
  // Update recommendation
  const recommendation = document.querySelector('#canvas .analysis-recommendation');
  if (recommendation) {
    let recText = '';
    if (data.completionRate > 80) {
      recText = '✅ Excellent! Votre famille a une gestion financière très efficace.';
    } else if (data.completionRate > 60) {
      recText = '📈 Bonne gestion. Continuez à optimiser vos ressources familiales.';
    } else if (data.completionRate > 40) {
      recText = '⚠️ Gestion moyenne. Améliorez la planification financière familiale.';
    } else {
      recText = '🚨 Gestion faible. Revisitez votre stratégie financière familiale.';
    }
    
    recommendation.innerHTML = `<strong>Recommandation IA:</strong> ${recText}`;
  }
}

function renderComparisonChart() {
  const ctx = document.getElementById('comparisonChart');
  if (!ctx) {
    console.log('Comparison chart canvas not found');
    return;
  }

  if (charts.comparison) {
    charts.comparison.destroy();
  }

  // Apply date filters to monthly data
  let data = [...(appData.monthly_data || [])];
  
  if (currentFilters.startDate && currentFilters.endDate) {
    const startDate = new Date(currentFilters.startDate);
    const endDate = new Date(currentFilters.endDate);
    
    data = data.filter(d => {
      const monthDate = new Date(d.month + '-01');
      return (monthDate >= startDate && monthDate <= endDate);
    });
  }
  
  data = data.slice(0, 7);
  
  charts.comparison = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => {
        const date = new Date(d.month + '-01');
        return date.toLocaleDateString('fr-FR', { month: 'short' });
      }),
      datasets: [
        {
          label: 'Prévu (Besoins)',
          data: data.map(d => d.needs / 1000000),
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.1)',
          fill: false,
          tension: 0.1
        },
        {
          label: 'Réel (Allocations)',
          data: data.map(d => d.actual / 1000000),
          borderColor: '#B4413C',
          backgroundColor: 'rgba(180, 65, 60, 0.1)',
          fill: false,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Montant (M FCFA)'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Évolution Prévu vs Réel (Janvier - Novembre 2025)'
        }
      }
    }
  });

  console.log('Comparison chart rendered');
}

// Settings rendering
function renderSettings() {
  console.log('Rendering settings...');
  renderUsersTable();
  renderAuditTrail();
  renderSettingsParamsUI();
  initSettingsTabs();
  populateResponsibleDropdowns(); // Populate dropdowns when settings are rendered
}

function renderSettingsParamsUI(){
  try{
    const section = document.getElementById('settings');
    if (!section) return;
    if (document.getElementById('settingsParamsPanel')) return;
    const panel = document.createElement('div');
    panel.id = 'settingsParamsPanel';
    panel.style.margin = '12px 0';
    panel.style.padding = '12px';
    panel.style.border = '1px solid rgba(0,0,0,0.08)';
    panel.style.borderRadius = '8px';
    const strict = !!getParamValue('Mode_Strict_Allocations', false);
    const cash = getParamValue('Cash_on_hand', 0) || 0;
    panel.innerHTML = `
      <h4 style="margin:0 0 8px 0;">Paramètres d'allocation</h4>
      <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <input type="checkbox" id="paramStrictAllocations" ${strict? 'checked':''} />
        <span>Mode Strict Allocations (bloquer dépassements)</span>
      </label>
      <label style="display:flex;align-items:center;gap:8px;">
        <span>Trésorerie (Cash_on_hand):</span>
        <input type="number" id="paramCashOnHand" class="form-control" style="max-width:180px;" value="${cash}" />
      </label>
    `;
    section.appendChild(panel);
    const strictEl = document.getElementById('paramStrictAllocations');
    const cashEl = document.getElementById('paramCashOnHand');
    if (strictEl) strictEl.onchange = ()=>{ setParamValue('Mode_Strict_Allocations', !!strictEl.checked, 'ALLOCATION'); showToast('Paramètre mis à jour', 'success'); };
    if (cashEl) cashEl.onchange = ()=>{ const v = parseFloat(cashEl.value||'0')||0; setParamValue('Cash_on_hand', v, 'TRÉSORERIE'); showToast('Trésorerie mise à jour', 'success'); };
  }catch(e){ console.warn('renderSettingsParamsUI failed', e); }
}
function initSettingsTabs() {
  const tabBtns = document.querySelectorAll('.settings-tab-btn');
  const tabContents = document.querySelectorAll('.settings-tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      
      tabBtns.forEach(tb => tb.classList.remove('active'));
      btn.classList.add('active');
      
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTab) {
          content.classList.add('active');
        }
      });

      if (targetTab === 'audit') {
        renderAuditTrail();
      }
    });
  });
}

function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) {
    console.log('Users table body not found');
    return;
  }

  tbody.innerHTML = appData.users.map(user => `
    <tr>
      <td><strong>${user.full_name}</strong></td>
      <td>${user.family_relation}</td>
      <td><span class="status--${user.role === 'Administrateur' ? 'success' : 'info'}">${user.role}</span></td>
      <td><span class="status--${user.allocation_priority === 'Critique' ? 'error' : 'warning'}">${user.allocation_priority}</span></td>
      <td>${user.email}</td>
      <td><span class="status--success">${user.status}</span></td>
      <td>
        <button class="btn btn--sm btn--secondary" onclick="editUser(${user.id})">
          <i class="fas fa-edit"></i>
        </button>
      </td>
    </tr>
  `).join('');

  console.log('Users table rendered');
}

function renderAuditTrail() {
  const auditTimeline = document.getElementById('auditTimeline');
  if (!auditTimeline) {
    console.log('Audit timeline not found');
    return;
  }

  auditTimeline.innerHTML = appData.audit_trail.map(event => {
    const actionClass = event.action.toLowerCase();
    const iconMap = {
      create: 'fas fa-plus',
      update: 'fas fa-edit',
      delete: 'fas fa-trash',
      export: 'fas fa-download',
      import: 'fas fa-upload'
    };

    return `
      <div class="audit-item">
        <div class="audit-icon ${actionClass}">
          <i class="${iconMap[event.action.toLowerCase()] || 'fas fa-circle'}"></i>
        </div>
        <div class="audit-content">
          <div class="audit-action">${event.details}</div>
          <div class="audit-meta">
            <strong>${event.entity}</strong> ${event.entity_id ? `#${event.entity_id}` : ''} • 
            ${event.user} • 
            ${event.changes}
          </div>
          <div class="audit-timestamp">
            ${formatDate(event.timestamp)} à ${new Date(event.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
          </div>
        </div>
      </div>
    `;
  }).join('');

  console.log('Audit trail rendered');
}

// Modal functionality - Fixed version
function initModals() {
  console.log('Initializing modals...');
  
  const newProjectBtn = document.getElementById('newProjectBtn');
  const newSourceBtn = document.getElementById('newSourceBtn');
  const newAllocationBtn = document.getElementById('newAllocationBtn');
  const newProjectModal = document.getElementById('newProjectModal_old');
  const kpiInfoModal = document.getElementById('kpiInfoModal');
  const modalCloses = document.querySelectorAll('.modal-close');
  const newProjectForm = document.getElementById('newProjectForm');

  // KPI Info buttons - Fixed version
  document.addEventListener('click', (e) => {
    const infoBtn = e.target.closest('.kpi-info-btn');
    if (infoBtn) {
      e.preventDefault();
      e.stopPropagation();
      const formula = infoBtn.dataset.formula;
      showKPIInfo(formula);
      console.log('KPI info clicked:', formula);
    }
  });

  function showKPIInfo(formula) {
    const kpiFormulaText = document.getElementById('kpiFormulaText');
    if (kpiFormulaText) {
      kpiFormulaText.textContent = formula || 'Formule non disponible';
    }
    if (kpiInfoModal) {
      kpiInfoModal.classList.remove('hidden');
    }
  }

  // Open modals
  if (newProjectBtn) {
    newProjectBtn.addEventListener('click', () => {
      console.log('New project button clicked');
      
      // Get the modal first
      const newProjectModal = document.getElementById('newProjectModal_old');
      if (!newProjectModal) {
        console.error('newProjectModal_old not found');
        return;
      }
      
      // Reset global variables for new project creation
      window.__editingProjectId = null;
      window.__pendingParentProjectId = null;
      
      // Hide calculated fields section for new projects
      const calculatedSection = document.getElementById('calculatedFieldsSection');
      if (calculatedSection) calculatedSection.style.display = 'none';
      
      // Reset modal title and button text
      const modalTitle = newProjectModal.querySelector('h3');
      if (modalTitle) modalTitle.textContent = 'Nouveau Projet';
      
      const submitBtn = newProjectModal.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Créer Projet';
      
      // Reset form
      const form = document.getElementById('newProjectForm');
      if (form) form.reset();
      
      // Show modal
      newProjectModal.classList.remove('hidden');
    });
  }
  if (newSourceBtn) {
    newSourceBtn.addEventListener('click', () => {
      const modal = document.getElementById('newSourceModal');
      const form = document.getElementById('sourceForm') || modal?.querySelector('form');
      if (form) form.reset();
      if (modal) modal.classList.remove('hidden');
    });
  }
  if (newAllocationBtn) {
    newAllocationBtn.addEventListener('click', () => {
      const modal = document.getElementById('newAllocationModal');
      if (modal) modal.classList.remove('hidden');
    });
  }

  // Close modals
  modalCloses.forEach(close => {
    close.addEventListener('click', () => {
      const modal = close.closest('.modal');
      if (modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // Close modal on backdrop click - DISABLED per user request
  // Users should only close modals via form buttons or close (X) button
  /*
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });
  */

  // Handle form submission
  const handleProjectSubmit = (formEl)=>{
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('Form submitted, editing ID:', window.__editingProjectId, 'pending parent:', window.__pendingParentProjectId);
      
      const get = (id)=> document.getElementById(id);
      const type = get('projectType')?.value || 'Projet';
      const name = get('projectName')?.value || '';
      const category = get('projectCategory')?.value || '';
      const beneficiary = get('projectBeneficiary')?.value || 'Famille';
      const priority = get('projectPriority')?.value || 'Moyenne';
      const budget = parseFloat(get('projectBudget')?.value||'0')||0;
      const start_date = get('projectStart')?.value || '';
      const end_date = get('projectEnd')?.value || '';
      const responsible = get('projectResponsible')?.value || '';
      const probability = parseInt(get('projectProbability')?.value||'50');
      const roi = parseFloat(get('projectROI')?.value||'0');
      const notes = get('projectNotes')?.value || '';
      const parentPending = window.__pendingParentProjectId || null;
      
      // Fix: Only set parent_id for tasks, and only if we have a valid parent
      const parent_id = type==='Tâche' ? parentPending : null;
      const editingId = window.__editingProjectId;
      
      console.log('Form data:', { type, name, category, budget, parent_id, editingId });
      console.log('All form values:');
      console.log('- projectType element:', get('projectType'));
      console.log('- projectName element:', get('projectName'));
      console.log('- Values:', {
        type: get('projectType')?.value,
        name: get('projectName')?.value,
        category: get('projectCategory')?.value,
        budget: get('projectBudget')?.value,
        responsible: get('projectResponsible')?.value
      });

      if (editingId) {
        // Edit existing project
        const projectIndex = appData.projects.findIndex(p => p.id == editingId);
        if (projectIndex !== -1) {
          const oldProject = appData.projects[projectIndex];
          appData.projects[projectIndex] = {
            ...oldProject,
            name: type==='Tâche' ? `└─ ${name}` : name,
            category,
            beneficiary,
            priority,
            budget,
            remaining: budget - (oldProject.allocated || 0),
            start_date,
            end_date,
            responsible,
            probability,
            roi,
            notes
          };
          
          addAuditEvent('UPDATE', 'Utilisateur', editingId, oldProject.type || 'Projet', `Modification: ${name}`);
          showToast(`${oldProject.type || 'Projet'} modifié(e) avec succès!`, 'success');
        }
        window.__editingProjectId = null;
      } else {
        // Create new project with proper ID format
        let newId;
        if (type === 'Projet') {
          // Generate PXXX ID for projects
          const existingProjects = appData.projects.filter(p => p.parent_id === null);
          const existingIds = existingProjects.map(p => {
            const match = p.id.match(/P(\d+)/);
            return match ? parseInt(match[1]) : 0;
          });
          const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
          newId = `P${nextId}`;
        } else {
          // Generate TX ID for tasks
          const parentProject = appData.projects.find(p => p.id === parent_id);
          const parentNumericId = parentProject ? parseInt(parentProject.id.replace('P', '')) : 1;
          
          const existingTasks = appData.projects.filter(p => p.parent_id === parent_id);
          const existingTaskIds = existingTasks.map(t => {
            const match = t.id.match(/T(\d+)$/);
            return match ? parseInt(match[1]) : 0;
          });
          const nextTaskId = existingTaskIds.length > 0 ? Math.max(...existingTaskIds) + 1 : 1;
          newId = `T${parentNumericId}${nextTaskId}`;
        }
        
        const newItem = {
          id: newId,
          parent_id,
          type,
          name: type==='Tâche' ? `└─ ${name}` : name,
          category,
          kiyosaki_type: get('kiyosakirType')?.value || 'Actif générateur',
          beneficiary,
          priority,
          budget,
          allocated: 0,
          remaining: budget,
          start_date,
          end_date,
          realized_date: null,
          monthly_forecast: 0,
          progress: 0,
          status: 'Planifié',
          responsible,
          dependency: null,
          probability,
          roi,
          cash_flow: 0,
          notes
        };

        appData.projects.push(newItem);
        if (parent_id){
          const parent = appData.projects.find(p=>p.id===parent_id);
          if (parent){ parent.allocated = (parent.allocated||0) + budget; parent.remaining = (parent.budget||0) - (parent.allocated||0); }
        }
        addAuditEvent('CREATE', newItem.type, newItem.id, `Création ${newItem.type} ${newItem.name}`, `Budget: ${formatCurrency(newItem.budget)}, Resp: ${newItem.responsible}`);
        showToast(`${newItem.type} créé(e) avec succès!`, 'success');
      }
      
      renderProjects(); updateKPIs();
      const modal = document.getElementById('newProjectModal_old'); if (modal) modal.classList.add('hidden');
      formEl.reset();
      window.__pendingParentProjectId = null;
      
      // Reset submit button text
      const submitBtn = document.getElementById('projectSubmitBtn') || modal?.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Créer Projet';
      }
    });
  };

  if (newProjectForm) handleProjectSubmit(newProjectForm);
  const projectForm = document.getElementById('projectForm');
  if (projectForm && projectForm !== newProjectForm) handleProjectSubmit(projectForm);

  // Handle source form submission
  const sourceForm = document.getElementById('sourceForm');
  if (sourceForm) {
    sourceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const get = (id) => document.getElementById(id);
      const sourceId = get('sourceId')?.value;
      const name = get('sourceName')?.value || '';
      const type = get('sourceType')?.value || '';
      const responsible = get('sourceResponsible')?.value || '';
      const available = parseFloat(get('sourceAvailable')?.value || '0') || 0;
      const availability_date = get('sourceAvailabilityDate')?.value || '';
      const regularity = get('sourceRegularity')?.value || '';
      const notes = get('sourceNotes')?.value || '';
      
      if (sourceId) {
        // Edit existing source
        const sourceIndex = appData.sources.findIndex(s => s.id == sourceId);
        if (sourceIndex !== -1) {
          const oldSource = appData.sources[sourceIndex];
          appData.sources[sourceIndex] = {
            ...oldSource,
            name,
            type,
            responsible,
            available,
            remaining: available - (oldSource.allocated || 0),
            availability_date,
            regularity,
            notes,
            allocation_rate: oldSource.allocated ? (oldSource.allocated / available) * 100 : 0
          };
          
          showToast('Source modifiée avec succès!', 'success');
        }
      } else {
        // Create new source
        const newSource = {
          id: Date.now(),
          name,
          type,
          responsible,
          available,
          allocated: 0,
          remaining: available,
          availability_date,
          regularity,
          notes,
          allocation_rate: 0,
          status: 'DISPONIBLE'
        };
        
        appData.sources.push(newSource);
        showToast('Nouvelle source créée avec succès!', 'success');
      }
      
      renderSources();
      const modal = document.getElementById('newSourceModal');
      if (modal) modal.classList.add('hidden');
      sourceForm.reset();
    });
  }

  // Handle allocation form submission
  const allocationForm = document.getElementById('allocationForm');
  if (allocationForm) {
    allocationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const get = (id) => document.getElementById(id);
      const modal = document.getElementById('newAllocationModal');
      const editingId = modal?.dataset.editingId ? parseInt(modal.dataset.editingId) : null;
      
      const sourceId = parseInt(get('allocationSourceId')?.value || '0') || null;
      const taskId = parseInt(get('allocationTaskSelect')?.value || '0') || null;
      const plannedAmount = parseFloat(get('allocationPlannedAmount')?.value || '0') || 0;
      const actualAmount = parseFloat(get('allocationActualAmount')?.value || '0') || 0;
      const plannedDate = get('allocationPlannedDate')?.value || '';
      const actualDate = get('allocationActualDate')?.value || '';
      const responsible = get('allocationResponsible')?.value || '';
      const notes = get('allocationNotes')?.value || '';
      
      if (!sourceId || !taskId) {
        showToast('Veuillez sélectionner une source et une tâche', 'error');
        return;
      }
      
      const source = appData.sources.find(s => s.id === sourceId);
      const task = appData.projects.find(p => p.id === taskId);
      
      if (!source || !task) {
        showToast('Source ou tâche introuvable', 'error');
        return;
      }
      
      const amount = Math.max(plannedAmount, actualAmount);
      
      if (editingId) {
        // Mode édition
        const allocationIndex = appData.allocations.findIndex(a => a.id === editingId);
        if (allocationIndex !== -1) {
          const oldAllocation = appData.allocations[allocationIndex];
          const oldAmount = Math.max(oldAllocation.planned || 0, oldAllocation.actual || 0);
          
          // Restaurer les anciens montants
          const oldSource = appData.sources.find(s => s.id === oldAllocation.source_id);
          const oldTask = appData.projects.find(p => p.id === oldAllocation.task_id);
          
          if (oldSource) {
            oldSource.allocated = Math.max(0, (oldSource.allocated || 0) - oldAmount);
            oldSource.remaining = oldSource.available - oldSource.allocated;
            oldSource.allocation_rate = oldSource.available > 0 ? (oldSource.allocated / oldSource.available) * 100 : 0;
          }
          
          if (oldTask) {
            oldTask.allocated = Math.max(0, (oldTask.allocated || 0) - oldAmount);
            oldTask.remaining = oldTask.budget - oldTask.allocated;
          }
          
          // Vérifier les nouvelles capacités
          const sourceRemaining = source.available - (source.allocated || 0);
          const taskRemaining = task.budget - (task.allocated || 0);
          
          if (amount > sourceRemaining) {
            showToast(`Montant trop élevé. Reste disponible: ${formatCurrency(sourceRemaining)}`, 'error');
            return;
          }
          
          if (amount > taskRemaining) {
            showToast(`Montant trop élevé pour la tâche. Reste: ${formatCurrency(taskRemaining)}`, 'error');
            return;
          }
          
          // Mettre à jour l'allocation
          appData.allocations[allocationIndex] = {
            ...oldAllocation,
            source_id: sourceId,
            source_name: source.name,
            task_id: taskId,
            task_name: task.name.replace(/^└─\s*/, ''),
            project_parent: task.parent_id ? appData.projects.find(p => p.id === task.parent_id)?.name : '',
            planned: plannedAmount,
            actual: actualAmount,
            variance: actualAmount - plannedAmount,
            planned_date: plannedDate,
            actual_date: actualDate,
            status: actualAmount > 0 ? 'RÉALISÉ' : 'PLANIFIÉ',
            allocation_responsible: responsible,
            notes: notes,
            month: plannedDate ? plannedDate.substring(0, 7) : ''
          };
          
          showToast('Allocation modifiée avec succès!', 'success');
        }
      } else {
        // Mode création
        // Vérifier les capacités restantes
        const sourceRemaining = source.available - (source.allocated || 0);
        const taskRemaining = task.budget - (task.allocated || 0);
        
        if (amount > sourceRemaining) {
          showToast(`Montant trop élevé. Reste disponible: ${formatCurrency(sourceRemaining)}`, 'error');
          return;
        }
        
        if (amount > taskRemaining) {
          showToast(`Montant trop élevé pour la tâche. Reste: ${formatCurrency(taskRemaining)}`, 'error');
          return;
        }
        
        // Créer l'allocation
        const newAllocation = {
          id: Date.now(),
          source_id: sourceId,
          source_name: source.name,
          task_id: taskId,
          task_name: task.name.replace(/^└─\s*/, ''),
          project_parent: task.parent_id ? appData.projects.find(p => p.id === task.parent_id)?.name : '',
          planned: plannedAmount,
          actual: actualAmount,
          variance: actualAmount - plannedAmount,
          planned_date: plannedDate,
          actual_date: actualDate,
          status: actualAmount > 0 ? 'RÉALISÉ' : 'PLANIFIÉ',
          allocation_responsible: responsible,
          notes: notes,
          month: plannedDate ? plannedDate.substring(0, 7) : '' // YYYY-MM format
        };
        
        appData.allocations.push(newAllocation);
        showToast('Allocation créée avec succès!', 'success');
      }
      
      // Mettre à jour les montants alloués
      source.allocated = (source.allocated || 0) + amount;
      source.remaining = source.available - source.allocated;
      source.allocation_rate = (source.allocated / source.available) * 100;
      
      task.allocated = (task.allocated || 0) + amount;
      task.remaining = task.budget - task.allocated;

      // Mettre à jour la probabilité, les dates et le statut de la tâche selon financement
      try {
        const financedRatio = task.budget > 0 ? Math.min(1, (task.allocated || 0) / task.budget) : 0;
        // Probabilité basée sur couverture de financement (pondérée avec probabilité existante)
        const baseProb = task.probability || 0;
        const financeProb = Math.round(financedRatio * 100);
        task.probability = Math.max(baseProb, financeProb);

        // Dates: étendre la période si les dates d'allocation dépassent la plage de la tâche
        if (plannedDate) {
          if (!task.start_date || new Date(plannedDate) < new Date(task.start_date)) task.start_date = plannedDate;
          if (!task.end_date || new Date(plannedDate) > new Date(task.end_date)) task.end_date = plannedDate;
        }
        if (actualDate) {
          if (!task.start_date || new Date(actualDate) < new Date(task.start_date)) task.start_date = actualDate;
          if (!task.end_date || new Date(actualDate) > new Date(task.end_date)) task.end_date = actualDate;
          // Si allocation réelle couvre totalement le budget, on peut marquer "Terminé"
          if ((task.allocated || 0) >= (task.budget || 0)) {
            task.status = 'Terminé';
            task.realized_date = actualDate;
          } else {
            if (task.status === 'Planifié') task.status = 'En cours';
          }
        }
      } catch(err) { console.warn('Task update after allocation failed', err); }
      
      // Actualiser l'affichage
      renderAllocationsTable();
      renderSources();
      renderProjects();
      
      // Fermer le modal et nettoyer
      if (modal) {
        modal.classList.add('hidden');
        delete modal.dataset.editingId;
        
        // Restaurer le titre
        const modalTitle = modal.querySelector('h3');
        if (modalTitle) modalTitle.textContent = 'Nouvelle allocation';
      }
      allocationForm.reset();
    });
  }

  // Ajouter la fonctionnalité de recherche de tâches
  const taskSearch = document.getElementById('allocationTaskSearch');
  const taskSelect = document.getElementById('allocationTaskSelect');
  if (taskSearch && taskSelect) {
    taskSearch.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const options = Array.from(taskSelect.options);
      
      options.forEach(option => {
        if (option.value === '') return; // Keep the default option
        
        const taskName = option.textContent.toLowerCase();
        const isVisible = taskName.includes(searchTerm);
        option.style.display = isVisible ? '' : 'none';
        
        // Auto-select if only one match
        const visibleOptions = options.filter(opt => opt.value !== '' && opt.style.display !== 'none');
        if (visibleOptions.length === 1 && searchTerm.length > 2) {
          taskSelect.value = visibleOptions[0].value;
        }
      });
    });
    
    // Clear search when task is selected
    taskSelect.addEventListener('change', () => {
      if (taskSelect.value !== '') {
        taskSearch.value = '';
        // Show all options again
        Array.from(taskSelect.options).forEach(option => {
          option.style.display = '';
        });
      }
    });
  }

  // Handle task form submission
  const taskForm = document.getElementById('taskForm');
  if (taskForm) {
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const taskId = document.getElementById('taskId')?.value;
      const parentId = parseInt(document.getElementById('taskParentId')?.value) || null;
      const name = document.getElementById('taskName')?.value || '';
      const description = document.getElementById('taskDescription')?.value || '';
      const category = document.getElementById('taskCategory')?.value || '';
      const kiyosakinType = document.getElementById('taskKiyosakiType')?.value || 'Actif générateur';
      const beneficiary = document.getElementById('taskBeneficiary')?.value || 'Famille';
      const probability = 100; // Calcul automatique - pas d'input utilisateur
      const roi = parseFloat(document.getElementById('taskROI')?.value || '0') || 0;
      const responsible = document.getElementById('taskResponsible')?.value || '';
      const budget = parseFloat(document.getElementById('taskBudget')?.value || '0') || 0;
      const used = parseFloat(document.getElementById('taskUsed')?.value || '0') || 0;
      const startDate = document.getElementById('taskStartDate')?.value || '';
      const endDate = document.getElementById('taskEndDate')?.value || '';
      const priority = document.getElementById('taskPriority')?.value || 'moyenne';
      let status = document.getElementById('taskStatus')?.value || 'Planifié';
      
      // Auto-update status based on budget usage
      if (used > 0 && budget > 0) {
        const completion = used / budget;
        if (completion >= 1.0) {
          status = 'Terminé';
        } else if (status === 'Planifié') {
          status = 'En cours';
        }
      }      if (!name.trim()) {
        showToast('Le nom de la tâche est requis', 'error');
        return;
      }
      
      if (taskId) {
        // Edit existing task
        const taskIndex = appData.projects.findIndex(p => p.id == taskId);
        if (taskIndex !== -1) {
          const oldTask = appData.projects[taskIndex];
          appData.projects[taskIndex] = {
            ...oldTask,
            name: name.startsWith('└─ ') ? name : `└─ ${name}`,
            notes: description,
            category: category,
            kiyosaki_type: kiyosakinType,
            beneficiary: beneficiary,
            probability: probability,
            roi: roi,
            responsible: responsible,
            budget: budget,
            allocated: used,
            used: used,
            remaining: budget - used,
            start_date: startDate,
            end_date: endDate,
            priority: priority,
            status: status
          };
          
          addAuditEvent('UPDATE', 'Utilisateur', taskId, 'Tâche', `Modification de la tâche: ${name}`);
          showToast('Tâche modifiée avec succès!', 'success');
        }
      } else {
        // Create new task with proper ID format
        const parentProject = appData.projects.find(p => p.id === parentId);
        const parentNumericId = parentProject ? parseInt(parentProject.id.replace('P', '')) : 1;
        
        // Find the next available task ID for this project
        const existingTasks = appData.projects.filter(p => p.parent_id === parentId);
        const existingTaskIds = existingTasks.map(t => {
          const match = t.id.match(/T(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        });
        const nextTaskId = existingTaskIds.length > 0 ? Math.max(...existingTaskIds) + 1 : 1;
        
        const newTask = {
          id: `T${parentNumericId}${nextTaskId}`,
          parent_id: parentId,
          type: 'Tâche',
          name: name.startsWith('└─ ') ? name : `└─ ${name}`,
          category: category,
          kiyosaki_type: kiyosakinType,
          beneficiary: beneficiary,
          priority: priority,
          budget: budget,
          allocated: used,
          used: used,
          remaining: budget - used,
          start_date: startDate,
          end_date: endDate,
          realized_date: null,
          monthly_forecast: 0,
          progress: used > 0 ? Math.min((used / budget) * 100, 100) : 0,
          status: status,
          responsible: responsible,
          dependency: null,
          probability: probability,
          roi: roi,
          cash_flow: 0,
          notes: description
        };
        
        appData.projects.push(newTask);
        
        // Update parent project if exists
        if (parentId) {
          const parent = appData.projects.find(p => p.id === parentId);
          if (parent) {
            parent.allocated = (parent.allocated || 0) + budget;
            parent.remaining = (parent.budget || 0) - (parent.allocated || 0);
          }
        }
        
        addAuditEvent('CREATE', 'Utilisateur', newTask.id, 'Tâche', `Création de la tâche: ${name}`);
        showToast('Tâche créée avec succès!', 'success');
      }
      
      // Update parent project aggregates if task has a parent
      const finalParentId = taskId ? 
        (appData.projects.find(p => p.id == taskId)?.parent_id) : 
        parentId;
      
      if (finalParentId) {
        const parentProject = appData.projects.find(p => p.id === finalParentId);
        if (parentProject) {
          const aggregates = calculateProjectAggregates(finalParentId);
          Object.assign(parentProject, {
            category: aggregates.category,
            kiyosaki_type: aggregates.kiyosaki_type,
            beneficiary: aggregates.beneficiary,
            priority: aggregates.priority,
            budget: aggregates.budget,
            start_date: aggregates.start_date,
            end_date: aggregates.end_date,
            probability: aggregates.probability,
            roi: aggregates.roi
          });
          
          console.log('Updated parent project aggregates:', parentProject.name, aggregates);
        }
      }
      
      // Close modal and refresh
      const modal = document.getElementById('taskModal');
      if (modal) modal.classList.add('hidden');
      taskForm.reset();
      renderSectionContent('projects');
      updateKPIs();
    });
  }

  // Handle user form submission
  const userForm = document.getElementById('userForm');
  if (userForm) {
    userForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const userId = document.getElementById('userId')?.value;
      const fullName = document.getElementById('userFullName')?.value || '';
      const role = document.getElementById('userRole')?.value || '';
      const beneficiaryType = document.getElementById('userBeneficiaryType')?.value || '';
      const email = document.getElementById('userEmail')?.value || '';
      const phone = document.getElementById('userPhone')?.value || '';
      const birthDate = document.getElementById('userBirthDate')?.value || '';
      const familyRelation = document.getElementById('userFamilyRelation')?.value || '';
      const allocationPriority = document.getElementById('userAllocationPriority')?.value || '';
      const status = document.getElementById('userStatus')?.value || 'Actif';
      const notes = document.getElementById('userNotes')?.value || '';
      
      if (!fullName.trim()) {
        showToast('Le nom complet est requis', 'error');
        return;
      }
      
      if (userId) {
        // Edit existing user
        const userIndex = appData.users.findIndex(u => u.id == userId);
        if (userIndex !== -1) {
          appData.users[userIndex] = {
            ...appData.users[userIndex],
            full_name: fullName,
            role: role,
            beneficiary_type: beneficiaryType,
            email: email,
            phone: phone,
            birth_date: birthDate,
            family_relation: familyRelation,
            allocation_priority: allocationPriority,
            status: status,
            notes: notes
          };
          
          showToast('Utilisateur modifié avec succès!', 'success');
        }
      } else {
        // Create new user
        const newUser = {
          id: Math.max(...appData.users.map(u => u.id || 0), 0) + 1,
          full_name: fullName,
          role: role,
          beneficiary_type: beneficiaryType,
          email: email,
          phone: phone,
          birth_date: birthDate,
          family_relation: familyRelation,
          allocation_priority: allocationPriority,
          status: status,
          notes: notes
        };
        
        appData.users.push(newUser);
        showToast('Utilisateur créé avec succès!', 'success');
      }
      
      // Close modal and refresh
      const modal = document.getElementById('userModal');
      if (modal) modal.classList.add('hidden');
      userForm.reset();
      renderUsersTable();
      populateResponsibleDropdowns(); // Refresh dropdowns with new user
    });
  }

  console.log('Modals initialized');
}

function updateKPIs() {
  // Recalculate KPIs based on current data
  const projects = appData.projects.filter(p => p.parent_id === null);
  appData.kpis.active_projects = projects.filter(p => p.status === 'En cours' || p.status === 'Planifié').length;
  appData.kpis.total_budget = projects.reduce((sum, p) => sum + p.budget, 0);
  appData.kpis.total_used = projects.reduce((sum, p) => sum + p.allocated, 0);
  appData.kpis.average_progress = projects.reduce((sum, p) => sum + (p.progress * p.budget), 0) / appData.kpis.total_budget;
  
  renderKPIs();
}

// Chat functionality - Fixed version
function initChat() {
  console.log('Initializing chat...');
  
  const chatToggle = document.getElementById('chatToggle');
  const chatClose = document.getElementById('chatClose');
  const chatContainer = document.getElementById('chatContainer');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  const chatMessages = document.getElementById('chatMessages');

  console.log('Chat elements found:', {
    toggle: !!chatToggle,
    close: !!chatClose,
    container: !!chatContainer,
    input: !!chatInput,
    send: !!chatSend,
    messages: !!chatMessages
  });

  const responses = [
    "Votre taux d'épargne de 22.5% est excellent! Continuez ainsi.",
    "Le projet Bepanda a un ROI de 35%, c'est très prometteur.",
    "Considérez diversifier vos revenus vers plus d'investissements passifs.",
    "Vos KPI montrent une excellente santé financière familiale.",
    "Le Baby Step 4 de Ramsey nécessite 15% d'investissement retraite."
  ];

  if (chatToggle && chatContainer) {
    chatToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Chat toggle clicked');
      chatContainer.classList.toggle('hidden');
    });
  }

  if (chatClose && chatContainer) {
    chatClose.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Chat close clicked');
      chatContainer.classList.add('hidden');
    });
  }

  function sendMessage() {
    if (!chatInput || !chatMessages) return;
    
    const message = chatInput.value.trim();
    if (!message) return;

    console.log('Sending message:', message);

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.innerHTML = `
      <i class="fas fa-user"></i>
      <div class="message-content">${message}</div>
    `;
    chatMessages.appendChild(userMsg);

    // Clear input
    chatInput.value = '';

    // Simulate bot response
    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.className = 'chat-message bot';
      const response = responses[Math.floor(Math.random() * responses.length)];
      botMsg.innerHTML = `
        <i class="fas fa-robot"></i>
        <div class="message-content">${response}</div>
      `;
      chatMessages.appendChild(botMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  if (chatSend) {
    chatSend.addEventListener('click', (e) => {
      e.preventDefault();
      sendMessage();
    });
  }

  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  console.log('Chat initialized');
}

// Export/Import functionality
function initExports() {
  const exportBtns = document.querySelectorAll('.export-btn');
  const exportCompleteBtn = document.getElementById('exportCompleteBtn');
  const exportTemplate = document.getElementById('exportTemplate');
  const executeExport = document.getElementById('executeExport');
  
  exportBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.content-section');
      const sectionName = section ? section.id : 'données';
      
      showToast(`Export ${sectionName} en cours...`, 'info');
      
      setTimeout(() => {
        simulateExport(sectionName);
      }, 1500);
    });
  });

  if (exportCompleteBtn) {
    exportCompleteBtn.addEventListener('click', async () => {
      try {
        showToast('Export EXCEL en cours...', 'info');
        await exportAppExcelXLSX();
        showToast('Export EXCEL terminé', 'success');
      } catch(e) {
        console.error(e); showToast('Export EXCEL impossible, fallback simulation', 'warning');
        setTimeout(()=>simulateExport('complet'), 500);
      }
    });
  }

  if (exportTemplate) {
    exportTemplate.addEventListener('click', () => {
      showToast('Génération template Excel...', 'info');
      setTimeout(() => {
        showToast('Template Excel généré!', 'success');
      }, 1000);
    });
  }

  if (executeExport) {
    executeExport.addEventListener('click', async () => {
      const format = document.getElementById('exportFormat')?.value || 'excel';
      showToast(`Export ${format.toUpperCase()} en cours...`, 'info');
      try{
        if (format === 'excel') { await exportAppExcelXLSX(); showToast('Export EXCEL terminé', 'success'); }
        else if (format === 'json') { await exportAppJSON(); showToast('Export JSON terminé', 'success'); }
        else if (format === 'csv') { await exportAppCSV(); showToast('Export CSV terminé', 'success'); }
        else { simulateExport(`export-${format}`); }
      }catch(e){ console.error(e); showToast('Export impossible, fallback simulation', 'warning'); simulateExport(`export-${format}`); }
    });
  }
}

async function ensureXlsxLoaded(){
  if (window.XLSX) return;
  await new Promise((resolve, reject)=>{
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload = ()=>resolve();
    s.onerror = ()=>reject(new Error('XLSX failed to load'));
    document.head.appendChild(s);
  });
}

function splitProjectsAndTasks(all){
  const projects = (all||[]).filter(p=>p && p.parent_id==null);
  const tasks = (all||[]).filter(p=>p && p.parent_id!=null);
  return {projects, tasks};
}
function sheetToJsonSafe(ws){
  try { return window.XLSX.utils.sheet_to_json(ws, {defval: null}); } catch(e){ return []; }
}
async function exportAppExcelXLSX(){
  await ensureXlsxLoaded();
  const wb = window.XLSX.utils.book_new();
  const {projects, tasks} = splitProjectsAndTasks(appData.projects||[]);
  
  // S'assurer que les projets agrègent leurs tâches (budget, allocated, etc.)
  const projectsWithAggregation = projects.map(project => {
    const projectTasks = tasks.filter(task => task.parent_id === project.id);
    const aggregatedBudget = projectTasks.reduce((sum, task) => sum + (task.budget || 0), 0);
    const aggregatedAllocated = projectTasks.reduce((sum, task) => sum + (task.allocated || 0), 0);
    const aggregatedProgress = projectTasks.length > 0 ? 
      projectTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / projectTasks.length : project.progress || 0;
    
    return {
      ...project,
      // Mettre à jour les valeurs agrégées si des tâches existent
      budget: projectTasks.length > 0 ? (project.budget || 0) + aggregatedBudget : project.budget,
      allocated: projectTasks.length > 0 ? (project.allocated || 0) + aggregatedAllocated : project.allocated,
      remaining: projectTasks.length > 0 ? 
        ((project.budget || 0) + aggregatedBudget) - ((project.allocated || 0) + aggregatedAllocated) : 
        project.remaining,
      progress: aggregatedProgress,
      tasks_count: projectTasks.length
    };
  });
  
  const toSheet = (arr)=> window.XLSX.utils.json_to_sheet(arr);
  const append = (ws, name)=> window.XLSX.utils.book_append_sheet(wb, ws, name);
  append(toSheet(projectsWithAggregation), 'Projects');
  append(toSheet(tasks), 'Tasks');
  append(toSheet(appData.sources||[]), 'Sources');
  append(toSheet(appData.allocations||[]), 'Allocations');
  append(toSheet(appData.users||[]), 'Users');
  append(toSheet(appData.parameters||[]), 'Parameters');
  append(toSheet(appData.monthly_data||[]), 'MonthlyData');
  append(toSheet(appData.audit_trail||[]), 'Audit');
  const filename = 'export_app.xlsx';
  window.XLSX.writeFile(wb, filename);
}

async function importAppFromWorkbook(wb){
  await ensureXlsxLoaded();
  const getWS = (name)=> wb.Sheets[name];
  const projects = sheetToJsonSafe(getWS('Projects'));
  const tasks = sheetToJsonSafe(getWS('Tasks'));
  const sources = sheetToJsonSafe(getWS('Sources'));
  const allocations = sheetToJsonSafe(getWS('Allocations'));
  const users = sheetToJsonSafe(getWS('Users'));
  const parameters = sheetToJsonSafe(getWS('Parameters'));
  const monthly = sheetToJsonSafe(getWS('MonthlyData'));
  const audit = sheetToJsonSafe(getWS('Audit'));

  // Reconstituer appData de manière remplaçante si feuilles présentes
  if (projects.length || tasks.length) appData.projects = [...(projects||[]), ...(tasks||[])];
  if (sources.length) appData.sources = sources;
  if (allocations.length) appData.allocations = allocations;
  if (users.length) appData.users = users;
  if (parameters.length) appData.parameters = parameters;
  if (monthly.length) appData.monthly_data = monthly;
  if (audit.length) appData.audit_trail = audit;

  recalcAllAggregates();
  updateKPIs();
  const activeSection = document.querySelector('.content-section.active');
  if (activeSection) renderSectionContent(activeSection.id); else renderDashboard();
}

async function importAppFromJson(payload){
  try{
    const data = payload && payload.appData ? payload.appData : payload;
    if (!data || typeof data !== 'object') throw new Error('Structure JSON invalide');
    if (data.projects) appData.projects = data.projects;
    if (data.sources) appData.sources = data.sources;
    if (data.allocations) appData.allocations = data.allocations;
    if (data.users) appData.users = data.users;
    if (data.parameters) appData.parameters = data.parameters;
    if (data.monthly_data) appData.monthly_data = data.monthly_data;
    if (data.audit_trail) appData.audit_trail = data.audit_trail;
    recalcAllAggregates();
    updateKPIs();
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) renderSectionContent(activeSection.id); else renderDashboard();
  }catch(e){ console.error(e); throw e; }
}
function recalcAllAggregates(){
  try{
    const parents = (appData.projects||[]).filter(p=>p && p.parent_id==null);
    parents.forEach(p=>{
      const tasks = (appData.projects||[]).filter(t=>t.parent_id===p.id);
      const totalBudget = tasks.reduce((s,t)=>s + (Number(t.budget)||0), 0);
      const allocated = tasks.reduce((s,t)=>s + (Number(t.allocated)||0), 0);
      const completed = tasks.reduce((s,t)=>s + ((Number(t.budget)||0) * (Number(t.progress)||0)/100), 0);
      p.allocated = allocated;
      p.remaining = (Number(p.budget)||0) - (p.allocated||0);
      p.progress = totalBudget? (completed/totalBudget*100) : (p.progress||0);
    });
  }catch(e){ console.warn('recalcAllAggregates failed', e); }
}

function ensureDownload(filename, blob){
  try{
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u);
  }catch(e){ console.error('download failed', e); }
}
async function exportAppJSON(){
  const payload = { timestamp: new Date().toISOString(), appData };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  ensureDownload('export_app.json', blob);
}
function toCSV(arr){
  const rows = Array.isArray(arr)? arr.slice() : [];
  const keys = Array.from(rows.reduce((s,o)=>{ Object.keys(o||{}).forEach(k=>s.add(k)); return s; }, new Set()));
  const escape=(v)=>{
    if (v==null) return '';
    const s = typeof v==='object'? JSON.stringify(v) : String(v);
    return '"' + s.replace(/"/g,'""') + '"';
  };
  const header = keys.map(k=>`"${k}"`).join(',');
  const lines = rows.map(o=> keys.map(k=> escape(o[k])).join(','));
  return [header, ...lines].join('\n');
}
async function exportAppCSV(){
  const {projects, tasks} = splitProjectsAndTasks(appData.projects||[]);
  const files = [
    {name:'Projects.csv', data: projects},
    {name:'Tasks.csv', data: tasks},
    {name:'Sources.csv', data: appData.sources||[]},
    {name:'Allocations.csv', data: appData.allocations||[]},
    {name:'Users.csv', data: appData.users||[]},
    {name:'Parameters.csv', data: appData.parameters||[]},
    {name:'MonthlyData.csv', data: appData.monthly_data||[]},
    {name:'Audit.csv', data: appData.audit_trail||[]}
  ];
  files.forEach(f=>{
    const csv = toCSV(f.data);
    ensureDownload(f.name, new Blob([csv], {type:'text/csv;charset=utf-8'}));
  });
}
function simulateExport(type) {
  const exportData = {
    timestamp: new Date().toISOString(),
    type: type,
    filters: currentFilters,
    projects: appData.projects,
    sources: appData.sources,
    allocations: appData.allocations,
    users: appData.users,
    kpis: appData.kpis,
    monthly_data: appData.monthly_data
  };
  
  addAuditEvent('EXPORT', 'Données', null, 
    `Export ${type}`, 
    `Format: Excel, ${exportData.projects.length} projets, ${exportData.sources.length} sources`);
  
  showToast(`Export ${type} terminé!`, 'success');
  console.log('Export data:', exportData);
}

function initImports() {
  const importDataBtn = document.getElementById('importDataBtn');
  const selectFileBtn = document.getElementById('selectFileBtn');
  const excelFileInput = document.getElementById('excelFileInput');
  const executeImport = document.getElementById('executeImport');

  if (selectFileBtn && excelFileInput) {
    selectFileBtn.addEventListener('click', () => {
      excelFileInput.click();
    });

    excelFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
          fileInfo.innerHTML = `
            <strong>Fichier sélectionné:</strong> ${file.name}<br>
            <strong>Taille:</strong> ${(file.size / 1024).toFixed(1)} KB<br>
            <strong>Type:</strong> ${file.type}
          `;
        }
        
        if (executeImport) {
          executeImport.disabled = false;
        }
      }
    });
  }

  if (executeImport) {
    executeImport.addEventListener('click', async () => {
      try{
        const file = excelFileInput.files[0];
        if (!file) { showToast('Aucun fichier sélectionné', 'warning'); return; }
        const name = (file.name||'').toLowerCase();
        const reader = new FileReader();
        if (name.endsWith('.json')){
          reader.onload = async (e)=>{
            try{
              const text = e.target.result;
              const payload = JSON.parse(text);
              await importAppFromJson(payload);
              showToast('Import JSON terminé', 'success');
            }catch(err){ console.error(err); showToast('Import JSON échoué', 'error'); }
          };
          reader.readAsText(file);
        } else {
          await ensureXlsxLoaded();
          reader.onload = async (e)=>{
            try{
              const data = new Uint8Array(e.target.result);
              const wb = window.XLSX.read(data, {type: 'array'});
              await importAppFromWorkbook(wb);
              showToast('Import EXCEL terminé', 'success');
            }catch(err){ console.error(err); showToast('Import EXCEL échoué', 'error'); }
          };
          reader.readAsArrayBuffer(file);
        }
      }catch(e){ console.error(e); showToast('Import impossible, fallback simulation', 'warning'); const file = excelFileInput.files[0]; if (file) simulateImport(file); }
    });
  }

  if (importDataBtn) {
    importDataBtn.addEventListener('click', () => {
      showToast('Fonction d\'import rapide - En cours de développement', 'info');
    });
  }
}

function simulateImport(file) {
  showToast('Analyse du fichier Excel...', 'info');
  
  setTimeout(() => {
    showToast('Validation des données...', 'warning');
    
    setTimeout(() => {
      const importResults = {
        projects_added: 3,
        sources_added: 2,
        allocations_added: 5,
        users_updated: 1
      };
      
      addAuditEvent('IMPORT', 'Excel', null, 
        `Import fichier ${file.name}`, 
        `${importResults.projects_added} projets, ${importResults.sources_added} sources ajoutés`);
      
      showToast(`Import terminé! ${importResults.projects_added} projets et ${importResults.sources_added} sources ajoutés.`, 'success');
      
      // Reset form
      const fileInput = document.getElementById('excelFileInput');
      const executeImport = document.getElementById('executeImport');
      const fileInfo = document.getElementById('fileInfo');
      
      if (fileInput) fileInput.value = '';
      if (executeImport) executeImport.disabled = true;
      if (fileInfo) fileInfo.innerHTML = '';
      
    }, 1500);
  }, 1000);
}

function initSettings() {
  const saveKpiConfig = document.getElementById('saveKpiConfig');
  const resetKpiConfig = document.getElementById('resetKpiConfig');
  const runScenarios = document.getElementById('runScenarios');
  const addUserBtn = document.getElementById('addUserBtn');

  if (saveKpiConfig) {
    saveKpiConfig.addEventListener('click', () => {
      showToast('Configuration KPI sauvegardée!', 'success');
      addAuditEvent('UPDATE', 'Configuration', null, 'Mise à jour paramètres KPI', 'Seuils et calculs modifiés');
    });
  }

  if (resetKpiConfig) {
    resetKpiConfig.addEventListener('click', () => {
      showToast('Paramètres réinitialisés aux valeurs par défaut', 'info');
    });
  }

  if (runScenarios) {
    runScenarios.addEventListener('click', () => {
      showToast('Lancement des simulations What-If...', 'info');
      setTimeout(() => {
        showToast('Simulations terminées! Résultats mis à jour.', 'success');
      }, 2000);
    });
  }

  if (addUserBtn) {
    addUserBtn.addEventListener('click', () => {
      try {
        const modal = document.getElementById('userModal');
        const title = document.getElementById('userModalTitle');
        const form = document.getElementById('userForm');
        
        if (!modal || !title || !form) {
          showToast('Modal utilisateur non trouvé', 'error');
          return;
        }
        
        // Set modal title
        title.textContent = 'Nouvel Utilisateur';
        
        // Reset form
        form.reset();
        document.getElementById('userId').value = '';
        
        // Show modal
        modal.classList.remove('hidden');
      } catch (e) {
        console.error('Error opening add user modal:', e);
        showToast('Erreur lors de l\'ouverture du modal', 'error');
      }
    });
  }
}

// Global action functions
window.editProject = function(projectId) {
  try{
    const p = (appData.projects||[]).find(x=>x.id===projectId);
    if (!p) { 
      showToast('Projet non trouvé', 'error');
      return; 
    }

    // Use the newProjectModal_old for editing (it has all the fields)
    const modal = document.getElementById('newProjectModal_old');
    const form = document.getElementById('newProjectForm');
    
    if (!modal || !form) { 
      showToast('Modal de projet non trouvé', 'error'); 
      return; 
    }
    
    // Store the project ID for editing
    window.__editingProjectId = projectId;
    
    // Show calculated fields section for editing
    const calculatedSection = document.getElementById('calculatedFieldsSection');
    if (calculatedSection) calculatedSection.style.display = 'block';
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Fill form with existing data - use the correct field IDs from newProjectForm
    console.log('Populating form with project data:', p);
    const set=(id,val)=>{ 
      const el=document.getElementById(id); 
      if (el) { 
        el.value = val??''; 
        console.log(`✓ Set ${id} = "${val}"`); 
      } else { 
        console.error(`✗ Field ${id} not found in DOM`); 
      } 
    };
    
    set('projectType', p.type||'Projet');
    set('projectName', (p.name||'').replace(/^└─\s*/, ''));
    set('projectCategory', p.category||'');
    set('projectBeneficiary', p.beneficiary||'Famille');
    set('projectPriority', p.priority||'Moyenne');
    set('projectBudget', p.budget||0);
    set('projectStart', p.start_date||'');
    set('projectEnd', p.end_date||'');
    set('projectResponsible', p.responsible||'');
    set('projectProbability', p.probability||50);
    set('projectROI', p.roi||0);
    set('kiyosakirType', p.kiyosaki_type||'Actif générateur');
    
    const n=document.getElementById('projectNotes'); 
    if (n) { 
      n.value = p.notes||''; 
      console.log(`Set projectNotes = ${p.notes}`);
    } else {
      console.warn('projectNotes field not found');
    }
    
    // Update modal title and button
    const modalTitle = modal.querySelector('h3');
    if (modalTitle) modalTitle.textContent = 'Modifier Projet';
    
    const submitBtn = modal.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = 'Modifier Projet';
    }
    
    console.log('Project edit form populated for project:', p.name);
    
    // Wait a moment then check if fields are actually populated
    setTimeout(() => {
      const checkFields = ['projectName', 'projectCategory', 'projectBudget', 'projectResponsible'];
      checkFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          console.log(`Field ${id} current value: "${el.value}"`);
        }
      });
    }, 100);
    
    // Update calculated aggregates display
    updateProjectAggregatesDisplay(projectId);
    
    showToast('Formulaire de projet pré-rempli', 'info');
  }catch(e){ 
    console.error('Error editing project:', e); 
    showToast('Erreur lors de l\'édition du projet', 'error');
  }
};

window.addTask = function(projectId) {
  try{
    // Use the dedicated task modal instead
    openTaskModal(null, projectId);
  }catch(e){ 
    console.error('Error opening task modal:', e);
    showToast('Erreur lors de l\'ouverture du modal de tâche', 'error');
  }
};

window.allocateSource = function(sourceId) {
  try {
    const modal = document.getElementById('newAllocationModal');
    const src = (appData.sources||[]).find(s=>s.id===sourceId);
    if (modal && src) {
      // Réinitialiser le modal (sortir du mode édition)
      delete modal.dataset.editingId;
      
      // Changer le titre du modal pour nouvelle allocation
      const modalTitle = modal.querySelector('h3');
      if (modalTitle) modalTitle.textContent = `Nouvelle allocation – ${src.name}`;
      
      // Réinitialiser tous les champs du formulaire
      const form = document.getElementById('allocationForm');
      if (form) form.reset();
      
      const sid = document.getElementById('allocationSourceId'); if (sid) sid.value = src.id;
      const sname = document.getElementById('allocationSourceName'); if (sname) sname.value = src.name||'';
      const msname = document.getElementById('modalSourceName'); if (msname) msname.textContent = src.name||'';
      const mad = document.getElementById('modalAvailabilityDate'); if (mad) mad.textContent = src.availability_date ? formatDate(src.availability_date) : '-';
      // Recalcul en temps réel des totaux source pour éviter les valeurs obsolètes
      const srcAllocated = (appData.allocations||[]).filter(a=>a.source_id===src.id).reduce((s,a)=> s + Math.max(a.planned||0, a.actual||0), 0);
      const srcRemaining = Math.max(0, (src.available||0) - srcAllocated);
      const mav = document.getElementById('modalAvailable'); if (mav) mav.textContent = formatCurrency(src.available||0);
      const mrem = document.getElementById('modalRemaining'); if (mrem) mrem.textContent = formatCurrency(srcRemaining);
      
      // Calculer et afficher le pourcentage utilisé
      const mur = document.getElementById('modalUsedRate'); 
      if (mur) {
        const usedRate = src.available ? ((srcAllocated || 0) / (src.available || 1) * 100).toFixed(1) : '0';
        mur.textContent = usedRate + '%';
      }
      
      const resp = document.getElementById('allocationResponsible'); if (resp) resp.value = src.responsible||'';
      const taskSelect = document.getElementById('allocationTaskSelect');
      if (taskSelect) {
        taskSelect.innerHTML = '';
        (appData.projects||[]).filter(p=>p.parent_id!==null).forEach(t=>{
          const opt = document.createElement('option'); opt.value = t.id; opt.textContent = (t.name||'').replace(/^└─\s*/, ''); taskSelect.appendChild(opt);
        });
      }
      // Attacher interactions (mode strict + deltas)
      try { attachAllocationInteractions(src); } catch(e) { console.warn('attachAllocationInteractions failed', e); }
      modal.classList.remove('hidden');
    } else {
      showToast(`Allocation de la source ${sourceId}`, 'info');
    }
  } catch(e) { console.error(e); showToast('Erreur ouverture allocation','error'); }
};

window.editUser = function(userId) {
  try {
    const user = appData.users.find(u => u.id === userId);
    if (!user) {
      showToast('Utilisateur non trouvé', 'error');
      return;
    }
    
    const modal = document.getElementById('userModal');
    const title = document.getElementById('userModalTitle');
    if (!modal || !title) {
      showToast('Modal utilisateur non trouvé', 'error');
      return;
    }
    
    // Set modal title
    title.textContent = 'Éditer Utilisateur';
    
    // Fill form with user data
    document.getElementById('userId').value = user.id;
    document.getElementById('userFullName').value = user.full_name || '';
    document.getElementById('userRole').value = user.role || '';
    document.getElementById('userBeneficiaryType').value = user.beneficiary_type || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPhone').value = user.phone || '';
    document.getElementById('userBirthDate').value = user.birth_date || '';
    document.getElementById('userFamilyRelation').value = user.family_relation || '';
    document.getElementById('userAllocationPriority').value = user.allocation_priority || '';
    document.getElementById('userStatus').value = user.status || 'Actif';
    document.getElementById('userNotes').value = user.notes || '';
    
    // Show modal
    modal.classList.remove('hidden');
  } catch (e) {
    console.error('Error editing user:', e);
    showToast('Erreur lors de l\'édition de l\'utilisateur', 'error');
  }
};

window.editSource = function(sourceId) {
  try {
    const src = (appData.sources||[]).find(s=>s.id===sourceId);
    const modal = document.getElementById('newSourceModal');
    if (modal && src) {
      const set = (id,val)=>{ const el=document.getElementById(id); if (el) el.value = val??''; };
      set('sourceId', src.id);
      set('sourceName', src.name);
      set('sourceType', src.type);
      set('sourceResponsible', src.responsible);
      set('sourceAvailable', src.available);
      const f = document.getElementById('sourceForecast'); if (f) f.value = src.forecast||0;
      set('sourceAvailabilityDate', src.availability_date);
      set('sourceRegularity', src.regularity);
      const n = document.getElementById('sourceNotes'); if (n) n.value = src.notes||'';
      modal.classList.remove('hidden');
    } else {
      showToast(`Édition de la source ${sourceId}`, 'info');
    }
  } catch(e) { console.error(e); showToast('Erreur édition source','error'); }
};

window.deleteSource = function(sourceId) {
  try {
    const src = (appData.sources||[]).find(s=>s.id===sourceId);
    if (!src) {
      showToast('Source introuvable', 'error');
      return;
    }
    
    // Vérifier s'il y a des allocations liées à cette source
    const hasAllocations = (appData.allocations||[]).some(a => a.source_id === sourceId);
    
    let message = `Êtes-vous sûr de vouloir supprimer la source "${src.name}" ?`;
    if (hasAllocations) {
      message += '\n\nAttention : Cette source a des allocations liées qui seront également supprimées.';
    }
    
    if (confirm(message)) {
      // Supprimer la source
      const sourceIndex = appData.sources.findIndex(s => s.id === sourceId);
      if (sourceIndex !== -1) {
        appData.sources.splice(sourceIndex, 1);
      }
      
      // Supprimer les allocations liées
      if (hasAllocations) {
        appData.allocations = appData.allocations.filter(a => a.source_id !== sourceId);
      }
      
      // Actualiser l'affichage
      renderSources();
      showToast('Source supprimée avec succès', 'success');
    }
  } catch(e) { 
    console.error(e); 
    showToast('Erreur lors de la suppression', 'error'); 
  }
};

window.editAllocation = function(allocationId) {
  try {
    const allocation = (appData.allocations||[]).find(a=>a.id===allocationId);
    const modal = document.getElementById('newAllocationModal');
    if (modal && allocation) {
      const set = (id,val)=>{ const el=document.getElementById(id); if (el) el.value = val??''; };
      
      // Récupérer la source pour mettre à jour les informations
      const source = appData.sources.find(s => s.id === allocation.source_id);
      
      // Pré-remplir le formulaire avec les données de l'allocation
      set('allocationSourceId', allocation.source_id);
      set('allocationSourceName', allocation.source_name);
      set('allocationTaskSelect', allocation.task_id);
      set('allocationPlannedAmount', allocation.planned);
      set('allocationActualAmount', allocation.actual);
      set('allocationPlannedDate', allocation.planned_date);
      set('allocationActualDate', allocation.actual_date);
      set('allocationResponsible', allocation.allocation_responsible);
      set('allocationNotes', allocation.notes);
      
      // Mettre à jour les informations de la source dans le modal
      if (source) {
        const msname = document.getElementById('modalSourceName'); 
        if (msname) msname.textContent = source.name || '';
        
        const mad = document.getElementById('modalAvailabilityDate'); 
        if (mad) mad.textContent = source.availability_date ? formatDate(source.availability_date) : '-';
        
        // Recalculer l'alloué et le restant sur la base des allocations courantes
        const srcAllocated = (appData.allocations||[])
          .filter(a => a.source_id === source.id)
          .reduce((s,a)=> s + Math.max(a.planned||0, a.actual||0), 0);
        const mav = document.getElementById('modalAvailable'); 
        if (mav) mav.textContent = formatCurrency(source.available || 0);
        const mrem = document.getElementById('modalRemaining'); 
        if (mrem) mrem.textContent = formatCurrency(Math.max(0,(source.available||0) - srcAllocated));
        
        const mur = document.getElementById('modalUsedRate'); 
        if (mur) {
          const usedRate = source.available ? ((srcAllocated || 0) / (source.available || 1) * 100).toFixed(1) : '0';
          mur.textContent = usedRate + '%';
        }
      }
      
      // Marquer le modal comme mode édition
      modal.dataset.editingId = allocationId;
      
      // Changer le titre du modal
      const modalTitle = modal.querySelector('h3');
      if (modalTitle) modalTitle.textContent = `Éditer allocation - ${allocation.source_name}`;
      
      // Peupler la liste des tâches
      const taskSelect = document.getElementById('allocationTaskSelect');
      if (taskSelect) {
        taskSelect.innerHTML = '';
        (appData.projects||[]).filter(p=>p.parent_id!==null).forEach(t=>{
          const opt = document.createElement('option'); 
          opt.value = t.id; 
          opt.textContent = (t.name||'').replace(/^└─\s*/, ''); 
          if (t.id === allocation.task_id) opt.selected = true;
          taskSelect.appendChild(opt);
        });
      }
      
      // Attacher les interactions pour calculer les deltas
      if (source) {
        try { 
          attachAllocationInteractions(source); 
        } catch(e) { 
          console.warn('attachAllocationInteractions failed', e); 
        }
      }
      
      modal.classList.remove('hidden');
    } else {
      showToast(`Édition de l'allocation ${allocationId}`, 'info');
    }
  } catch(e) { 
    console.error(e); 
    showToast('Erreur édition allocation','error'); 
  }
};

window.deleteAllocation = function(allocationId) {
  try {
    const allocation = (appData.allocations||[]).find(a=>a.id===allocationId);
    if (!allocation) {
      showToast('Allocation introuvable', 'error');
      return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer cette allocation de ${formatCurrency(allocation.planned)} ?`)) {
      // Récupérer la source et la tâche pour mettre à jour leurs totaux
      const source = appData.sources.find(s => s.id === allocation.source_id);
      const task = appData.projects.find(p => p.id === allocation.task_id);
      
      // Retirer le montant des totaux alloués
      const amount = Math.max(allocation.planned || 0, allocation.actual || 0);
      if (source) {
        source.allocated = Math.max(0, (source.allocated || 0) - amount);
        source.remaining = source.available - source.allocated;
        source.allocation_rate = source.available > 0 ? (source.allocated / source.available) * 100 : 0;
      }
      
      if (task) {
        task.allocated = Math.max(0, (task.allocated || 0) - amount);
        task.remaining = task.budget - task.allocated;
      }
      
      // Supprimer l'allocation
      const allocationIndex = appData.allocations.findIndex(a => a.id === allocationId);
      if (allocationIndex !== -1) {
        appData.allocations.splice(allocationIndex, 1);
      }
      
      // Actualiser l'affichage
      renderAllocationsTable();
      renderSources();
      renderProjects();
      showToast('Allocation supprimée avec succès', 'success');
    }
  } catch(e) { 
    console.error(e); 
    showToast('Erreur lors de la suppression', 'error'); 
  }
};

// Function to populate responsible dropdowns from users data
function populateResponsibleDropdowns() {
  const dropdowns = [
    'taskResponsible',
    'projectResponsible'
  ];
  
  dropdowns.forEach(dropdownId => {
    const select = document.getElementById(dropdownId);
    if (select) {
      // Clear existing options except the first one (-- Sélectionner --)
      const defaultOption = select.querySelector('option[value=""]');
      select.innerHTML = '';
      if (defaultOption) {
        select.appendChild(defaultOption);
      } else {
        const newDefaultOption = document.createElement('option');
        newDefaultOption.value = '';
        newDefaultOption.textContent = '-- Sélectionner --';
        select.appendChild(newDefaultOption);
      }
      
      // Add users from appData
      if (appData.users && appData.users.length > 0) {
        appData.users.forEach(user => {
          const option = document.createElement('option');
          option.value = user.full_name;
          option.textContent = user.full_name;
          select.appendChild(option);
        });
      }
    }
  });
}

// Smart task sorting function
function sortTasksIntelligently(tasks) {
  return tasks.sort((a, b) => {
    // 1. First, separate completed tasks (put them at the end)
    const aCompleted = a.status === 'Terminé';
    const bCompleted = b.status === 'Terminé';
    
    if (aCompleted && !bCompleted) return 1;  // a goes after b
    if (!aCompleted && bCompleted) return -1; // a goes before b
    
    // 2. For tasks with same completion status, sort by start date (most recent first)
    const aDate = new Date(a.start_date || '1900-01-01');
    const bDate = new Date(b.start_date || '1900-01-01');
    
    return bDate.getTime() - aDate.getTime(); // Descending order (recent first)
  });
}

// Filter tasks based on selected month/year filters - using period overlap logic
function filterTasksByCurrentPeriod(tasks) {
  console.log('filterTasksByCurrentPeriod called with:', tasks.length, 'tasks');
  console.log('Current filters:', currentFilters);
  
  // Handle new date range filters
  if (currentFilters.startDate && currentFilters.endDate) {
    const startDate = new Date(currentFilters.startDate);
    const endDate = new Date(currentFilters.endDate);
    
    console.log('Filtering by date range:', currentFilters.startDate, 'to', currentFilters.endDate);
    
    return tasks.filter(task => {
      // Show tasks without dates
      if (!task.start_date && !task.end_date) return true;
      
      // Parse task dates
      const taskStartDate = new Date(task.start_date || task.end_date);
      const taskEndDate = new Date(task.end_date || task.start_date);
      
      // Handle invalid dates
      if (isNaN(taskStartDate.getTime()) || isNaN(taskEndDate.getTime())) {
        return true; // Show tasks with invalid dates
      }
      
      // Check if task overlaps with filter period
      return (taskStartDate <= endDate && taskEndDate >= startDate);
    });
  }
  
  // If no date filters are selected, show all tasks
  console.log('No date filters - showing all tasks');
  return tasks;
}

// Initialize application - Fixed version
document.addEventListener('DOMContentLoaded', function() {
  console.log('=== Initializing Family Finance Manager ===');
  
  try {
    // Fix migrated data structure first - DISABLED
    console.log('0. Fixing migrated data structure... DISABLED');
    // fixMigratedData();
    
    // Initialize all modules with error handling
    console.log('1. Initializing navigation...');
    initNavigation();
    
    console.log('2. Initializing dark mode...');
    initDarkMode(); 
    
    console.log('3. Initializing filters...');
    initFilters();
    
    console.log('4. Initializing modals...');
    initModals();
    
    console.log('5. Initializing analyses...');
    initAnalyses();
    
    console.log('6. Initializing exports...');
    initExports();
    
    console.log('7. Initializing imports...');
    initImports();
    
    console.log('8. Initializing settings...');
    initSettings();
    
    console.log('8.5. Initializing Google Drive...');
    initGoogleDrive();
    
    console.log('8.6. Populating responsible dropdowns...');
    populateResponsibleDropdowns();
    
    console.log('9. Initializing chat...');
    initChat();
    
    console.log('10. Rendering initial content...');
    // Render initial content
    if (typeof loadCurrentSection === 'function') { loadCurrentSection(); } else { renderDashboard(); }
    // React to hash changes
    window.addEventListener('hashchange', () => { if (typeof loadCurrentSection === 'function') loadCurrentSection(); });
    
    console.log('=== Application initialized successfully! ===');
    showToast('Application chargée avec succès! 🎉', 'success');
    
  } catch (error) {
    console.error('Error initializing application:', error);
    showToast('Erreur lors du chargement de l\'application', 'error');
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  Object.values(charts).forEach(chart => {
    if (chart && typeof chart.resize === 'function') {
      chart.resize();
    }
  });
});

// Project aggregation functions
function calculateProjectAggregates(projectId) {
  const tasks = appData.projects.filter(p => p.parent_id === projectId);
  
  if (tasks.length === 0) {
    return {
      category: '',
      kiyosaki_type: '',
      beneficiary: '',
      priority: '',
      budget: 0,
      start_date: '',
      end_date: '',
      probability: 0,
      roi: 0,
      tasks_count: 0
    };
  }
  
  // Calcul des agrégats
  const totalBudget = tasks.reduce((sum, task) => sum + (task.budget || 0), 0);
  const avgProbability = tasks.reduce((sum, task) => sum + (task.probability || 0), 0) / tasks.length;
  const avgROI = tasks.reduce((sum, task) => sum + (task.roi || 0), 0) / tasks.length;
  
  // Dates (min start, max end)
  const startDates = tasks.filter(t => t.start_date).map(t => new Date(t.start_date));
  const endDates = tasks.filter(t => t.end_date).map(t => new Date(t.end_date));
  const minStartDate = startDates.length > 0 ? new Date(Math.min(...startDates)).toISOString().split('T')[0] : '';
  const maxEndDate = endDates.length > 0 ? new Date(Math.max(...endDates)).toISOString().split('T')[0] : '';
  
  // Catégorie majoritaire
  const categories = tasks.map(t => t.category).filter(c => c);
  const categoryCount = categories.reduce((acc, cat) => { acc[cat] = (acc[cat] || 0) + 1; return acc; }, {});
  const majorityCategory = Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b, '');
  
  // Bénéficiaire majoritaire
  const beneficiaries = tasks.map(t => t.beneficiary).filter(b => b);
  const beneficiaryCount = beneficiaries.reduce((acc, ben) => { acc[ben] = (acc[ben] || 0) + 1; return acc; }, {});
  const majorityBeneficiary = Object.keys(beneficiaryCount).reduce((a, b) => beneficiaryCount[a] > beneficiaryCount[b] ? a : b, '');
  
  // Priorité la plus élevée
  const priorityOrder = { 'Critique': 4, 'Haute': 3, 'Moyenne': 2, 'Basse': 1 };
  const priorities = tasks.map(t => t.priority).filter(p => p);
  const highestPriority = priorities.reduce((highest, current) => 
    (priorityOrder[current] || 0) > (priorityOrder[highest] || 0) ? current : highest, '');
  
  // Type Kiyosaki majoritaire
  const types = tasks.map(t => t.kiyosaki_type).filter(t => t);
  const typeCount = types.reduce((acc, type) => { acc[type] = (acc[type] || 0) + 1; return acc; }, {});
  const majorityType = Object.keys(typeCount).reduce((a, b) => typeCount[a] > typeCount[b] ? a : b, '');
  
  return {
    category: majorityCategory,
    kiyosaki_type: majorityType,
    beneficiary: majorityBeneficiary,
    priority: highestPriority,
    budget: totalBudget,
    start_date: minStartDate,
    end_date: maxEndDate,
    probability: Math.round(avgProbability),
    roi: Math.round(avgROI * 100) / 100,
    tasks_count: tasks.length
  };
}

function updateProjectAggregatesDisplay(projectId) {
  if (!projectId) return;
  
  const aggregates = calculateProjectAggregates(projectId);
  
  // Mise à jour des champs calculés visibles
  const setCalcField = (id, value, fallback = 'Non défini') => {
    const el = document.getElementById(id);
    if (el) el.value = value || fallback;
  };
  
  setCalcField('projectCategoryCalc', aggregates.category);
  setCalcField('kiyosakirTypeCalc', aggregates.kiyosaki_type);
  setCalcField('projectBeneficiaryCalc', aggregates.beneficiary);
  setCalcField('projectPriorityCalc', aggregates.priority);
  setCalcField('projectBudgetCalc', formatCurrency(aggregates.budget));
  setCalcField('projectTasksCount', aggregates.tasks_count.toString());
  setCalcField('projectStartCalc', aggregates.start_date ? formatDate(aggregates.start_date) : 'Non défini');
  setCalcField('projectEndCalc', aggregates.end_date ? formatDate(aggregates.end_date) : 'Non défini');
  setCalcField('projectProbabilityCalc', aggregates.probability + '%');
  setCalcField('projectROICalc', aggregates.roi + '%');
  
  // Mise à jour des champs cachés pour la soumission
  const setHiddenField = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
  };
  
  setHiddenField('projectCategory', aggregates.category);
  setHiddenField('kiyosakirType', aggregates.kiyosaki_type);
  setHiddenField('projectBeneficiary', aggregates.beneficiary);
  setHiddenField('projectPriority', aggregates.priority);
  setHiddenField('projectBudget', aggregates.budget);
  setHiddenField('projectStart', aggregates.start_date);
  setHiddenField('projectEnd', aggregates.end_date);
  setHiddenField('projectProbability', aggregates.probability);
  setHiddenField('projectROI', aggregates.roi);
}

// Task modal functions
window.openTaskModal = function(taskData = null, parentId = null) {
  try {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const title = document.getElementById('taskModalTitle');
    
    if (!modal || !form) {
      showToast('Modal de tâche non trouvé', 'error');
      return;
    }
    
    // Reset form
    form.reset();
    
    // Set modal title and hidden fields
    if (taskData) {
      title.textContent = 'Éditer la tâche';
      document.getElementById('taskId').value = taskData.id;
      document.getElementById('taskParentId').value = taskData.parent_id || '';
      
      // Fill form with existing data
      document.getElementById('taskName').value = taskData.name || '';
      document.getElementById('taskDescription').value = taskData.description || taskData.notes || '';
      document.getElementById('taskCategory').value = taskData.category || '';
      document.getElementById('taskKiyosakiType').value = taskData.kiyosaki_type || 'Actif générateur';
      document.getElementById('taskBeneficiary').value = taskData.beneficiary || 'Famille';
      document.getElementById('taskROI').value = taskData.roi || 0;
      document.getElementById('taskResponsible').value = taskData.responsible || '';
      document.getElementById('taskBudget').value = taskData.budget || '';
      document.getElementById('taskUsed').value = taskData.allocated || taskData.used || '';
      document.getElementById('taskStartDate').value = taskData.start_date || '';
      document.getElementById('taskEndDate').value = taskData.end_date || '';
      document.getElementById('taskPriority').value = taskData.priority || 'moyenne';
      document.getElementById('taskStatus').value = taskData.status || 'Planifié';
    } else {
      title.textContent = 'Nouvelle Tâche';
      document.getElementById('taskId').value = '';
      document.getElementById('taskParentId').value = parentId || '';
      document.getElementById('taskPriority').value = 'moyenne';
      document.getElementById('taskStatus').value = 'Planifié';
      
      // Afficher le projet parent (une seule fois)
      if (parentId) {
        const parentProject = appData.projects.find(p => p.id === parentId);
        if (parentProject) {
          // Supprimer l'ancienne info si elle existe
          const existingParentInfo = document.querySelector('.parent-project-info');
          if (existingParentInfo) {
            existingParentInfo.remove();
          }
          
          const parentInfo = document.createElement('div');
          parentInfo.className = 'parent-project-info';
          parentInfo.style.marginBottom = '16px';
          parentInfo.style.padding = '8px';
          parentInfo.style.backgroundColor = 'var(--bg-secondary)';
          parentInfo.style.borderRadius = '4px';
          parentInfo.style.fontSize = '14px';
          parentInfo.innerHTML = `
            <strong>Projet parent:</strong> ${parentProject.name} (ID: ${parentProject.id})
          `;
          
          const form = document.getElementById('taskForm');
          if (form) {
            form.insertBefore(parentInfo, form.firstChild);
          }
        }
      }
    }
    
    modal.classList.remove('hidden');
  } catch (e) {
    console.error('Error opening task modal:', e);
    showToast('Erreur lors de l\'ouverture du modal', 'error');
  }
};

window.editTask = function(taskId) {
  try {
    const task = (appData.projects || []).find(p => p.id === taskId);
    if (!task) {
      showToast('Tâche non trouvée', 'error');
      return;
    }
    openTaskModal(task);
  } catch (e) {
    console.error('Error editing task:', e);
    showToast('Erreur lors de l\'édition de la tâche', 'error');
  }
};

window.deleteTask = function(taskId) {
  try {
    const task = (appData.projects || []).find(p => p.id === taskId);
    if (!task) {
      showToast('Tâche non trouvée', 'error');
      return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer la tâche "${task.name}" ?`)) {
      const parentId = task.parent_id;
      
      // Remove task from projects array
      appData.projects = appData.projects.filter(p => p.id !== taskId);
      
      // Update parent project aggregates
      if (parentId) {
        const parentProject = appData.projects.find(p => p.id === parentId);
        if (parentProject) {
          const aggregates = calculateProjectAggregates(parentId);
          Object.assign(parentProject, {
            category: aggregates.category,
            kiyosaki_type: aggregates.kiyosaki_type,
            beneficiary: aggregates.beneficiary,
            priority: aggregates.priority,
            budget: aggregates.budget,
            start_date: aggregates.start_date,
            end_date: aggregates.end_date,
            probability: aggregates.probability,
            roi: aggregates.roi
          });
        }
      }
      
      // Add audit event
      addAuditEvent('DELETE', 'Utilisateur', taskId, 'Tâche', `Suppression de la tâche: ${task.name}`);
      
      // Refresh display
      renderSectionContent('projects');
      
      showToast('Tâche supprimée avec succès', 'success');
    }
  } catch (e) {
    console.error('Error deleting task:', e);
    showToast('Erreur lors de la suppression de la tâche', 'error');
  }
};

window.deleteProject = function(projectId) {
  try {
    const project = (appData.projects || []).find(p => p.id === projectId);
    if (!project) {
      showToast('Projet non trouvé', 'error');
      return;
    }
    
    // Check for associated tasks
    const tasks = appData.projects.filter(p => p.parent_id === projectId);
    const confirmMessage = tasks.length > 0 
      ? `Êtes-vous sûr de vouloir supprimer le projet "${project.name}" et ses ${tasks.length} tâche(s) associée(s) ?`
      : `Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?`;
    
    if (confirm(confirmMessage)) {
      // Remove project and associated tasks
      appData.projects = appData.projects.filter(p => p.id !== projectId && p.parent_id !== projectId);
      
      // Add audit event
      addAuditEvent('DELETE', 'Utilisateur', projectId, 'Projet', `Suppression du projet: ${project.name}`);
      
      // Refresh display
      renderSectionContent('projects');
      
      showToast('Projet supprimé avec succès', 'success');
    }
  } catch (e) {
    console.error('Error deleting project:', e);
    showToast('Erreur lors de la suppression du projet', 'error');
  }
};

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modals = document.querySelectorAll('.modal:not(.hidden)');
    modals.forEach(modal => modal.classList.add('hidden'));
  }
  
  if (e.ctrlKey && e.key === 'd') {
    e.preventDefault();
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) {
      toggle.click();
    }
  }

  if (e.ctrlKey && e.key === 'e') {
    e.preventDefault();
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
      const exportBtn = activeSection.querySelector('.export-btn');
      if (exportBtn) {
        exportBtn.click();
      }
    }
  }
});

// Auto-save functionality
let autoSaveTimer;
function triggerAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    console.log('Auto-saving data...');
    addAuditEvent('UPDATE', 'Système', null, 'Sauvegarde automatique', 'Données mises à jour');
    showToast('Données sauvegardées automatiquement', 'success');
  }, 5000);
}

document.addEventListener('change', () => {
  triggerAutoSave();
});

// ===== GOOGLE DRIVE INTEGRATION =====

// Google Drive API configuration (loaded from config.js)

let gapi = null;
let isGoogleDriveInitialized = false;

// Initialize Google Drive
function initGoogleDrive() {
  console.log('Initializing Google Drive...');
  
  // Check if Google APIs are loaded
  if (typeof gapi === 'undefined') {
    console.warn('Google APIs not loaded yet, retrying...');
    setTimeout(initGoogleDrive, 1000);
    return;
  }
  
  gapi = window.gapi;
  
  // Get configuration
  const config = window.GOOGLE_DRIVE_CONFIG || {
    apiKey: 'YOUR_API_KEY',
    clientId: 'YOUR_CLIENT_ID',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    scopes: 'https://www.googleapis.com/auth/drive.file'
  };
  
  // Initialize the API
  gapi.load('client:auth2', () => {
    gapi.client.init({
      apiKey: config.apiKey,
      clientId: config.clientId,
      discoveryDocs: config.discoveryDocs,
      scope: config.scopes,
      cookiePolicy: 'single_host_origin'
    }).then(() => {
      isGoogleDriveInitialized = true;
      console.log('Google Drive API initialized successfully');
      
      // Setup button event listener
      const saveToGoogleDriveBtn = document.getElementById('saveToGoogleDrive');
      if (saveToGoogleDriveBtn) {
        saveToGoogleDriveBtn.addEventListener('click', saveToGoogleDrive);
      }
    }).catch(error => {
      console.error('Error initializing Google Drive API:', error);
      showToast('Erreur lors de l\'initialisation de Google Drive', 'error');
    });
  });
}

// Save data to Google Drive
async function saveToGoogleDrive() {
  if (!isGoogleDriveInitialized) {
    showToast('Google Drive non initialisé', 'error');
    return;
  }
  
  try {
    // Show loading state
    const btn = document.getElementById('saveToGoogleDrive');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sauvegarde...';
    btn.disabled = true;
    
    // Authenticate user
    const authInstance = gapi.auth2.getAuthInstance();
    const user = authInstance.currentUser.get();
    
    if (!user.isSignedIn()) {
      await authInstance.signIn();
    }
    
    // Prepare data for export
    const exportData = {
      projects: appData.projects || [],
      sources: appData.sources || [],
      allocations: appData.allocations || [],
      users: appData.users || [],
      kpis: appData.kpis || {},
      monthly_data: appData.monthly_data || [],
      export_date: new Date().toISOString(),
      version: '1.0'
    };
    
    // Convert to JSON
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // Create file metadata
    const metadata = {
      name: `Gestionnaire_Financier_${new Date().toISOString().split('T')[0]}.json`,
      mimeType: 'application/json',
      parents: ['root'] // Save to root folder
      // Pour sauvegarder dans un dossier spécifique, remplace 'root' par l'ID du dossier
      // Exemple: parents: ['1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms']
    };
    
    // Upload file
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);
    
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.getAuthResponse().access_token}`
      },
      body: form
    });
    
    if (response.ok) {
      const result = await response.json();
      showToast('Données sauvegardées sur Google Drive avec succès! 🎉', 'success');
      console.log('File saved to Google Drive:', result);
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('Error saving to Google Drive:', error);
    showToast(`Erreur lors de la sauvegarde: ${error.message}`, 'error');
  } finally {
    // Restore button state
    const btn = document.getElementById('saveToGoogleDrive');
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Performance monitoring
let loadStartTime = performance.now();
window.addEventListener('load', () => {
  const loadTime = performance.now() - loadStartTime;
  console.log(`Application loaded in ${loadTime.toFixed(2)}ms`);
  
  if (loadTime < 2000) {
    console.log('✅ Performance objective met: < 2s loading time');
  } else {
    console.warn('⚠️ Performance objective not met: > 2s loading time');
  }
});