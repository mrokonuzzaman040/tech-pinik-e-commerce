import { createSupabaseClient } from '@/lib/supabase';
import HeroSliderClient from '@/components/hero-slider-client';

interface Slider {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  link_url?: string;
  button_text?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

async function getSliders(): Promise<Slider[]> {
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('sliders')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching sliders:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching sliders:', err);
    return [];
  }
}

const HeroSlider = async () => {
  const sliders = await getSliders();

  if (sliders.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] max-h-[60vh] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-2">No Sliders Available</h2>
          <p className="text-gray-500">Please add some sliders in the admin panel.</p>
        </div>
      </div>
    );
  }

  return <HeroSliderClient sliders={sliders} />;
};

export default HeroSlider;