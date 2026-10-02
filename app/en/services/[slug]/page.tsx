import { ServicePage, serviceMetadata, serviceParams } from "@/views/service";

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = serviceParams;
// Only slugs known at build time exist; anything else falls through to the global 404.
export const dynamicParams = false;
export const generateMetadata = ({ params }: Props) => serviceMetadata("en", params);

export default function Page({ params }: Props) {
  return <ServicePage lang="en" params={params} />;
}
