import {
  createWebsiteAnalysisRequest,
  getWebsiteAnalysisById,
  updateWebsiteAnalysisStatus,
  listWebsiteAnalysisRequests,
  deleteWebsiteAnalysisRequest
} from './prisma-utils';

async function testPrismaCRUD() {
  try {
    // Create
    console.log('Creating website analysis request...');
    const newAnalysis = await createWebsiteAnalysisRequest('https://example.com');
    console.log('Created analysis:', newAnalysis);

    // Read
    console.log('Fetching analysis by ID...');
    const fetchedAnalysis = await getWebsiteAnalysisById(newAnalysis.id);
    console.log('Fetched analysis:', fetchedAnalysis);

    // Update
    console.log('Updating analysis status...');
    const updatedAnalysis = await updateWebsiteAnalysisStatus(
      newAnalysis.id,
      'COMPLETED',
      { prompt: 'Sample rebuild prompt' }
    );
    console.log('Updated analysis:', updatedAnalysis);

    // List
    console.log('Listing recent analyses...');
    const recentAnalyses = await listWebsiteAnalysisRequests();
    console.log('Recent analyses:', recentAnalyses);

    // Delete
    console.log('Deleting analysis...');
    const deletedAnalysis = await deleteWebsiteAnalysisRequest(newAnalysis.id);
    console.log('Deleted analysis:', deletedAnalysis);

  } catch (error) {
    console.error('CRUD Test Failed:', error);
  }
}

// Uncomment to run
// testPrismaCRUD();

export default testPrismaCRUD;