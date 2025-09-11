import Navbar from "@/components/navbar";
import HeroSlider from "@/components/hero-slider";
import CategoryScroll from "@/components/category-scroll";
import ProductsByCategory from "@/components/products-by-category";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Slider Section */}
      <section className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <HeroSlider />
      </section>
      
      {/* Category Scroll Section */}
      <CategoryScroll />
      
      
      {/* Products by Category Section */}
      <ProductsByCategory />
    </div>
  );
}
