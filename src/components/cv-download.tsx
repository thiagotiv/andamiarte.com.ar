import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';

export function CvDownload({ path, prominent = false }: { path: string | null | undefined; prominent?: boolean }) {
  const [busy, setBusy] = useState(false);
  async function download() {
    if (!path) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.storage.from('profile-files').download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'curriculum.pdf';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error('No pudimos descargar el CV. Comprobá que hayas ingresado y volvé a intentarlo.');
    } finally { setBusy(false); }
  }
  return <Button type="button" variant={prominent ? 'cta' : 'ghost'} size={prominent ? 'lg' : 'default'} className={prominent ? '' : 'mt-2 w-full'} disabled={!path || busy} onClick={download}><Download />{busy ? 'Descargando…' : 'Descargar CV'}</Button>;
}