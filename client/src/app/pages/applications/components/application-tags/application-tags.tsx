import React, { useEffect, useState } from "react";

import { ConditionalRender } from "@app/shared/components";

import { Application, Tag, TagType } from "@app/api/models";
import { getTagById, getTagTypeById } from "@app/api/rest";
import {
  Label,
  LabelGroup,
  Spinner,
  Split,
  SplitItem,
} from "@patternfly/react-core";
import { DEFAULT_COLOR_LABELS } from "@app/Constants";

export interface ApplicationTagsProps {
  application: Application;
}

export const ApplicationTags: React.FC<ApplicationTagsProps> = ({
  application,
}) => {
  const [tagTypes, setTagTypes] = useState<Map<number, TagType>>(new Map()); // <tagTypeId, tagType>
  const [tags, setTags] = useState<Map<number, Tag[]>>(new Map()); // <tagTypeId, tags[]>

  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (application.tags) {
      setIsFetching(true);

      Promise.all(
        application.tags
          .map((f) => getTagById(f?.id || ""))
          .map((p) => p.catch(() => null))
      )
        .then((tags) => {
          const newTagTypes: Map<number, TagType> = new Map();
          const newTags: Map<number, Tag[]> = new Map();

          const tagValidResponses = tags.reduce((prev, current) => {
            if (current) {
              return [...prev, current.data];
            } else {
              return prev;
            }
          }, [] as Tag[]);

          Promise.all(
            tagValidResponses.map((tag) =>
              getTagTypeById(tag?.tagType?.id || 0)
            )
          ).then((tagTypes) => {
            // Tag types
            const tagTypeValidResponses = tagTypes.reduce((prev, current) => {
              if (current) {
                return [...prev, current.data];
              } else {
                return prev;
              }
            }, [] as TagType[]);
            tagValidResponses.forEach((tag) => {
              const tagTypeRef = tag.tagType;
              if (tagTypeRef?.id) {
                const thisTagsFullTagType = tagTypeValidResponses.find(
                  (tagType) => tagType.id === tagTypeRef?.id
                );
                const tagTypeWithColour: TagType = {
                  ...tagTypeRef,
                  colour: thisTagsFullTagType?.colour || "",
                };
                newTagTypes.set(tagTypeWithColour.id!, tagTypeWithColour);

                // // // Tags
                newTags.set(tagTypeWithColour.id!, [
                  ...(newTags.get(tagTypeWithColour.id!) || []),
                  tag,
                ]);
              }
            });

            setTagTypes(newTagTypes);
            setTags(newTags);

            setIsFetching(false);
          });
        })
        .catch(() => {
          setIsFetching(false);
        });
    } else {
      setTagTypes(new Map());
      setTags(new Map());
    }
  }, [application]);

  return (
    <ConditionalRender when={isFetching} then={<Spinner isSVG size="md" />}>
      <Split hasGutter>
        {Array.from(tagTypes.values())
          .sort((a, b) => (a.rank || 0) - (b.rank || 0))
          .map((tagType) => {
            return (
              <SplitItem key={tagType.id}>
                <LabelGroup numLabels={10}>
                  {tags
                    .get(tagType.id!)
                    ?.sort((a, b) => a.name.localeCompare(b.name))
                    .map((tag) => {
                      const colorLabel = DEFAULT_COLOR_LABELS.get(
                        tagType?.colour || ""
                      );

                      return (
                        <Label key={tag.id} color={colorLabel as any}>
                          {tag.name}
                        </Label>
                      );
                    })}
                </LabelGroup>
              </SplitItem>
            );
          })}
      </Split>
    </ConditionalRender>
  );
};
