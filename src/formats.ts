import type { Ketcher } from 'ketcher-core'

export function getExporter(filename: string, ketcher: Ketcher): () => Promise<string> {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()

  const exporters: Record<string, () => Promise<string>> = {
    '.mol': () => ketcher.getMolfile(),
    '.rxn': () => ketcher.getRxn(),
    '.ket': () => ketcher.getKet(),
    '.smiles': () => ketcher.getSmiles(),
    '.smi': () => ketcher.getSmiles(),
    '.cxsmiles': () => ketcher.getSmiles(true),
    '.cml': () => ketcher.getCml(),
    '.sdf': () => ketcher.getSdf(),
    '.cdxml': () => ketcher.getCDXml(),
    '.cdx': () => ketcher.getCDX(),
    '.inchi': () => ketcher.getInchi(),
    '.smarts': () => ketcher.getSmarts(),
    '.fasta': () => ketcher.getFasta()
  }

  return exporters[ext] || (() => ketcher.getKet())
}
