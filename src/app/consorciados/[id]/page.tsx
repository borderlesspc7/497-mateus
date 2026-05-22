import EditarConsorciadoForm from "../ui/EditarConsorciadoForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarConsorciadoPage({ params }: PageProps) {
  const { id } = await params;
  return <EditarConsorciadoForm id={id} />;
}
