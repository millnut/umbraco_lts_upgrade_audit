using Umbraco.Cms.Core.Models.PublishedContent;

namespace TestProject
{
    public class PublishedContentService
    {
        private readonly IPublishedSnapshotAccessor _publishedSnapshotAccessor;
        private readonly IPublishedSnapshot _publishedSnapshot;
        
        public PublishedContentService(
            IPublishedSnapshotAccessor publishedSnapshotAccessor,
            IPublishedSnapshot publishedSnapshot)
        {
            _publishedSnapshotAccessor = publishedSnapshotAccessor;
            _publishedSnapshot = publishedSnapshot;
        }
        
        public void DoSomething()
        {
            var snapshot = _publishedSnapshotAccessor.GetRequiredPublishedSnapshot();
            // Use IPublishedSnapshot again
            var content = _publishedSnapshot.Content;
        }
    }
}
