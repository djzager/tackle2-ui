import * as React from "react";
import {
  Alert,
  Card,
  CardBody,
  PageSection,
  PageSectionVariants,
  Switch,
  Text,
  TextContent,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import "./Repositories.css";
import { Setting } from "@app/api/models";
import { getSettingById, updateSetting } from "@app/api/rest";
import { AxiosError, AxiosPromise } from "axios";
import { useCallback, useEffect } from "react";
import { useFetch } from "@app/shared/hooks";
import { getAxiosErrorMessage } from "@app/utils/utils";

export const RepositoriesSvn: React.FC = () => {
  const { t } = useTranslation();
  const [error, setError] = React.useState<AxiosError>();

  const onChange = () => {
    const setting: Setting = {
      key: "svn.insecure.enabled",
      value: !svnInsecureSetting,
    };

    let promise: AxiosPromise<Setting>;
    if (svnInsecureSetting !== undefined) {
      promise = updateSetting(setting);
    } else {
      promise = updateSetting(setting);
    }

    promise
      .then((response) => {
        refreshSvnInsecureSetting();
      })
      .catch((error) => {
        setError(error);
      });
  };

  const fetchSvnInsecureSetting = useCallback(() => {
    return getSettingById("svn.insecure.enabled");
  }, []);

  const { data: svnInsecureSetting, requestFetch: refreshSvnInsecureSetting } =
    useFetch<boolean>({
      defaultIsFetching: true,
      onFetch: fetchSvnInsecureSetting,
    });

  useEffect(() => {
    refreshSvnInsecureSetting();
  }, [refreshSvnInsecureSetting]);

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.svnConfig")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <Card>
          <CardBody>
            {error && (
              <Alert
                variant="danger"
                isInline
                title={getAxiosErrorMessage(error)}
              />
            )}
            <Switch
              id="svn"
              className="repo"
              label="Consume insecure Subversion repositories"
              aria-label="Insecure Subversion Repositories"
              isChecked={svnInsecureSetting === true ? true : false}
              onChange={onChange}
            />
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
