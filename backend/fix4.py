with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\RecruitmentPipeline.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'toast.error(e.response?.data?.detail || "Failed to add player");',
    '''const detail = e.response?.data?.detail || "Failed to add player";
      if (detail.includes("already in pipeline")) {
        toast.info("This player is already in your pipeline");
      } else {
        toast.error(detail);
      }'''
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\RecruitmentPipeline.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")