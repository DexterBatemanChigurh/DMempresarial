import { Text } from "@/components/ui";

/** Texto institucional fixo (src/content/dm.ts): cada item da lista vira um parágrafo. */
export function Paragraphs({
  items,
  size,
  className,
}: {
  items: readonly string[];
  size?: "lg";
  className?: string;
}) {
  return (
    <div className={className ? `space-y-md ${className}` : "space-y-md"}>
      {items.map((paragraph, index) => (
        <Text key={index} size={size}>
          {paragraph}
        </Text>
      ))}
    </div>
  );
}
