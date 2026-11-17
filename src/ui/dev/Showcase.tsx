import { Button } from '../components/Button.tsx';
import { Card } from '../components/Card.tsx';
import { Chip } from '../components/Chip.tsx';
import { ProgressBar } from '../components/ProgressBar.tsx';

/** Dev-only page (open /#showcase) with every base component; used by the E2E and axe tests. */
export default function Showcase() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <h1 className="font-display text-4xl">Componentes</h1>

      <Card>
        <h2 className="mb-3 font-display text-2xl">Botones</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Siguiente</Button>
          <Button variant="secondary">Menú</Button>
          <Button disabled>Bloqueado</Button>
        </div>
      </Card>

      <Card tone="flags">
        <h2 className="font-display text-2xl">Banderas</h2>
      </Card>
      <Card tone="capitals">
        <h2 className="font-display text-2xl">Capitales</h2>
      </Card>
      <Card tone="shapes">
        <h2 className="font-display text-2xl">Siluetas</h2>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-2xl">Etiquetas y progreso</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <Chip tone="flags">Banderas</Chip>
          <Chip>Europa</Chip>
          <Chip>Medio</Chip>
        </div>
        <ProgressBar value={3} max={10} label="Progreso de la partida" />
      </Card>
    </main>
  );
}
