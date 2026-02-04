using Umbraco.Cms.Core.Models;

namespace TestProject
{
    public class SampleCode
    {
        public void TestMethod(IPublishedContent content)
        {
            // This uses a removed extension method
            var cropUrl = content.GetCropUrl("thumbnail");
            
            // Another removed method
            var hasProperty = content.HasProperty("title");
        }
    }
}
