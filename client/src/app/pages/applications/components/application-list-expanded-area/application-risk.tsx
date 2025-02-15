import React, { useCallback, useEffect } from "react";

import { RiskLabel } from "@app/shared/components";
import { useFetch } from "@app/shared/hooks";

import { Application, Assessment, AssessmentRisk } from "@app/api/models";
import { getAssessmentLandscape } from "@app/api/rest";

export interface IApplicationRiskProps {
  application: Application;
  assessment?: Assessment;
}

export const ApplicationRisk: React.FC<IApplicationRiskProps> = ({
  application,
  assessment,
}) => {
  // Risk
  const fetchRiskData = useCallback(() => {
    return getAssessmentLandscape([application.id!]).then(
      ({ data }) => data[0]
    );
  }, [application]);

  const { data: applicationRisk, requestFetch: fetchRisk } =
    useFetch<AssessmentRisk>({
      defaultIsFetching: true,
      onFetchPromise: fetchRiskData,
    });

  useEffect(() => {
    fetchRisk();
  }, [fetchRisk, application, assessment]);

  return (
    <RiskLabel risk={applicationRisk ? applicationRisk.risk : "UNKNOWN"} />
  );
};
