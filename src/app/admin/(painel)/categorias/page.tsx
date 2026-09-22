import type { Metadata } from "next";
import { CategoryItem } from "@/components/admin/taxonomy/category-item";
import { NewCategoryForm } from "@/components/admin/taxonomy/new-category-form";
import { NewTagForm } from "@/components/admin/taxonomy/new-tag-form";
import { TagItem } from "@/components/admin/taxonomy/tag-item";
import { FormMessage, Heading, Text } from "@/components/ui";
import {
  listCategoriesForAdminForRoute,
  listTagsForAdminForRoute,
} from "@/features/taxonomy/application/taxonomy-service";
import { AppError } from "@/lib/errors";
import { requireAdminSession } from "@/server/auth/admin-guard";

export const metadata: Metadata = { title: "Categorias e tags" };

export default async function TaxonomyPage() {
  const { actor } = await requireAdminSession();

  let categories, tags;
  try {
    [categories, tags] = await Promise.all([
      listCategoriesForAdminForRoute(actor),
      listTagsForAdminForRoute(actor),
    ]);
  } catch (error) {
    if (error instanceof AppError) {
      return (
        <>
          <Heading as="h1" variant="h1">
            Categorias e tags
          </Heading>
          <FormMessage tone="error" className="mt-xl">
            {error.publicMessage}
          </FormMessage>
        </>
      );
    }
    throw error;
  }

  return (
    <>
      <Heading as="h1" variant="h1">
        Categorias e tags
      </Heading>
      <Text tone="secondary" className="mt-md mb-2xl max-w-reading">
        Categorias organizam o blog por tema (todo artigo publicado precisa de uma principal). Tags
        são marcação livre, sem página própria.
      </Text>

      <section aria-labelledby="categorias-secao" className="mb-3xl">
        <Heading as="h2" variant="h3" id="categorias-secao" className="mb-md">
          Categorias ({categories.length})
        </Heading>
        <div className="mb-lg max-w-reading">
          <NewCategoryForm />
        </div>
        {categories.length === 0 ? (
          <Text tone="secondary">Nenhuma categoria ainda.</Text>
        ) : (
          <ul className="space-y-sm">
            {categories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                others={categories.filter((c) => c.id !== category.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="tags-secao">
        <Heading as="h2" variant="h3" id="tags-secao" className="mb-md">
          Tags ({tags.length})
        </Heading>
        <div className="mb-lg">
          <NewTagForm />
        </div>
        {tags.length === 0 ? (
          <Text tone="secondary">Nenhuma tag ainda.</Text>
        ) : (
          <ul className="space-y-sm">
            {tags.map((tag) => (
              <TagItem key={tag.id} tag={tag} others={tags.filter((t) => t.id !== tag.id)} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
