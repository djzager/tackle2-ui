import * as React from "react";
import { useIsMutating } from "react-query";
import { FieldValues, FormProvider, useForm } from "react-hook-form";
import {
  Truncate,
  Wizard,
  WizardStepFunctionType,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import {
  Application,
  TaskData,
  Taskgroup,
  TaskgroupTask,
} from "@app/api/models";
import { CustomRules } from "./custom-rules";
import { Review } from "./review";
import { SetMode } from "./set-mode";
import { SetOptions } from "./set-options";
import { SetScope } from "./set-scope";
import { SetTargets } from "./set-targets";
import {
  useCreateTaskgroupMutation,
  useDeleteTaskgroupMutation,
  useSubmitTaskgroupMutation,
  useUploadFileMutation,
} from "@app/queries/taskgroups";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import "./wizard.css";
import {
  isApplicationBinaryEnabled,
  isApplicationSourceCodeDepsEnabled,
  isApplicationSourceCodeEnabled,
  isModeSupported,
} from "./utils";
import { NotificationsContext } from "@app/shared/notifications-context";

interface IAnalysisWizard {
  applications: Application[];
  onClose: () => void;
  isOpen: boolean;
}

export interface IReadFile {
  fileName: string;
  loadError?: DOMException;
  loadPercentage?: number;
  loadResult?: "danger" | "success";
  data?: string;
  fullFile: File;
}

export interface IAnalysisWizardFormValues {
  artifact: string;
  targets: string[];
  sources: string[];
  withKnown: string;
  includedPackages: string[];
  excludedPackages: string[];
  customRulesFiles: IReadFile[];
  excludedRulesTags: string[];
  diva: boolean;
  hasExcludedPackages: boolean;
  ruleTagToExclude: string;
}

const defaultTaskData: TaskData = {
  output: "/windup/report",
  mode: {
    binary: false,
    withDeps: false,
    artifact: "",
    diva: false,
  },
  targets: [],
  sources: [],
  scope: {
    withKnown: false,
    packages: {
      included: [],
      excluded: [],
    },
  },
};

const initTask = (application: Application): TaskgroupTask => {
  return {
    name: `${application.name}.${application.id}.windup`,
    data: {},
    application: { id: application.id as number, name: application.name },
  };
};

export const AnalysisWizard: React.FC<IAnalysisWizard> = ({
  applications,
  onClose,
  isOpen,
}: IAnalysisWizard) => {
  const { t } = useTranslation();
  const title = t("dialog.title.applicationAnalysis");

  const { pushNotification } = React.useContext(NotificationsContext);

  const [isInitTaskgroup, setInitTaskgroup] = React.useState(false);
  const [createdTaskgroup, setCreatedTaskgroup] = React.useState<Taskgroup>();
  const [stepIdReached, setStepIdReached] = React.useState(1);
  const [mode, setMode] = React.useState("binary");
  const isMutating = useIsMutating();

  const [analyzeableApplications, setAnalyzeableApplications] = React.useState<
    Application[]
  >([]);

  const onCreateTaskgroupSuccess = (data: Taskgroup) => {
    setInitTaskgroup(true);
    setCreatedTaskgroup(data);
  };

  const onCreateTaskgroupError = (error: Error | unknown) => {
    console.log("Taskgroup creation failed: ", error);
    pushNotification({
      title: "Taskgroup creation failed",
      variant: "danger",
    });
    onClose();
  };

  const { mutate: createTaskgroup } = useCreateTaskgroupMutation(
    onCreateTaskgroupSuccess,
    onCreateTaskgroupError
  );

  const onSubmitTaskgroupSuccess = (data: Taskgroup) =>
    pushNotification({
      title: "Applications",
      message: "Submitted for analysis",
      variant: "danger",
    });

  const onSubmitTaskgroupError = (error: Error | unknown) =>
    pushNotification({
      title: "Taskgroup submit failed",
      variant: "danger",
    });

  const { mutate: submitTaskgroup } = useSubmitTaskgroupMutation(
    onSubmitTaskgroupSuccess,
    onSubmitTaskgroupError
  );

  const onUploadError = (error: Error | unknown) =>
    console.log("Taskgroup upload failed: ", error);

  const { mutate: uploadFile } = useUploadFileMutation(() => {}, onUploadError);

  const onDeleteTaskgroupSuccess = () => setInitTaskgroup(false);

  const onDeleteTaskgroupError = (error: Error | unknown) => {
    console.log("Taskgroup: delete failed: ", error);
    pushNotification({
      title: "Taskgroup: delete failed",
      variant: "danger",
    });
  };

  const { mutate: deleteTaskgroup } = useDeleteTaskgroupMutation(
    onDeleteTaskgroupSuccess,
    onDeleteTaskgroupError
  );

  const useWizardValidationSchema = () => {
    return yup.object().shape({
      ruleTagToExclude: yup
        .string()
        .matches(/^(|.{2,})$/, t("validation.minLength", { length: 2 })) // Either 0 or 2+ characters
        .max(60, t("validation.maxLength", { length: 60 })),
    });
  };

  const methods = useForm<IAnalysisWizardFormValues>({
    defaultValues: {
      artifact: "",
      targets: [],
      sources: [],
      withKnown: "app",
      includedPackages: [],
      excludedPackages: [],
      customRulesFiles: [],
      excludedRulesTags: [],
      ruleTagToExclude: "",
      diva: false,
      hasExcludedPackages: false,
    },
    resolver: yupResolver(useWizardValidationSchema()),
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = methods;
  const watchAllFields = watch();
  const { artifact, targets } = methods.getValues();

  const setTaskgroup = (taskgroup: Taskgroup, data: FieldValues): Taskgroup => {
    return {
      ...taskgroup,
      data: {
        ...defaultTaskData,
        mode: {
          binary: mode.includes("binary"),
          withDeps: mode === "source-code-deps",
          artifact: data.artifact ? `/binary/${data.artifact}` : "",
          diva: data.diva,
        },
        targets: data.targets,
        sources: data.sources,
        scope: {
          withKnown: data.withKnown.includes("oss") ? true : false,
          packages: {
            included: data.includedPackages,
            excluded: data.excludedPackages,
          },
        },
        rules: {
          path: data.customRulesFiles.length > 0 ? "/rules" : "",
          tags: {
            excluded: data.excludedRulesTags,
          },
        },
      },
    };
  };
  const areApplicationsBinaryEnabled = (): boolean =>
    applications.every((application) =>
      isApplicationBinaryEnabled(application)
    );

  const areApplicationsSourceCodeEnabled = (): boolean =>
    applications.every((application) =>
      isApplicationSourceCodeEnabled(application)
    );

  const areApplicationsSourceCodeDepsEnabled = (): boolean =>
    applications.every((application) =>
      isApplicationSourceCodeDepsEnabled(application)
    );

  const isModeValid = (): boolean => {
    if (mode === "binary-upload") return true;
    if (mode === "binary") return areApplicationsBinaryEnabled();
    else if (mode === "source-code-deps")
      return areApplicationsSourceCodeDepsEnabled();
    else return areApplicationsSourceCodeEnabled();
  };

  const onSubmit = (data: FieldValues) => {
    if (data.targets.length < 1) {
      console.log("Invalid form");
      return;
    }

    if (createdTaskgroup) {
      const taskgroup = setTaskgroup(createdTaskgroup, data);

      data.customRulesFiles.forEach((file: IReadFile) => {
        const formFile = new FormData();
        formFile.append("file", file.fullFile);
        uploadFile({
          id: taskgroup.id as number,
          path: `rules/${file.fileName}`,
          file: formFile,
        });
      });

      submitTaskgroup(taskgroup);
    }
    onClose();
  };

  const onMove: WizardStepFunctionType = (
    { id, name },
    { prevId, prevName }
  ) => {
    if (id && stepIdReached < id) setStepIdReached(id as number);
  };

  enum stepId {
    AnalysisMode = 1,
    UploadBinaryStep,
    SetTargets,
    Scope,
    CustomRules,
    Options,
    Review,
  }

  const handleClose = () => {
    setStepIdReached(stepId.AnalysisMode);
    reset();
    if (isInitTaskgroup && createdTaskgroup && createdTaskgroup.id)
      deleteTaskgroup(createdTaskgroup.id);
    onClose();
  };

  React.useEffect(() => {
    const apps = applications.filter((application) =>
      isModeSupported(application, mode)
    );
    setAnalyzeableApplications(apps);
  }, [mode]);

  React.useEffect(() => {
    if (isInitTaskgroup && createdTaskgroup && createdTaskgroup.id)
      deleteTaskgroup(createdTaskgroup.id);

    if (analyzeableApplications.length > 0) {
      const taskgroup: Taskgroup = {
        name: `taskgroup.windup`,
        addon: "windup",
        data: {
          ...defaultTaskData,
        },
        tasks: analyzeableApplications.map((app) => initTask(app)),
      };

      createTaskgroup(taskgroup);
    }
  }, [analyzeableApplications, createTaskgroup]);

  const isSingleAppBinaryUploadModeNextEnabled =
    analyzeableApplications.length === 1 &&
    !isMutating &&
    artifact !== "" &&
    mode === "binary-upload";

  const isModeNextEnabled =
    analyzeableApplications.length > 0 &&
    !isMutating &&
    mode !== "binary-upload";

  const steps = [
    {
      name: t("wizard.terms.configureAnalysis"),
      steps: [
        {
          id: stepId.AnalysisMode,
          name: t("wizard.terms.analysisMode"),
          component: (
            <SetMode
              mode={mode}
              isSingleApp={applications.length === 1 ? true : false}
              taskgroupID={createdTaskgroup?.id || null}
              isModeValid={isModeValid()}
              setMode={setMode}
            />
          ),

          enableNext:
            isModeNextEnabled || isSingleAppBinaryUploadModeNextEnabled,
          canJumpTo: stepIdReached >= stepId.AnalysisMode,
        },
        {
          id: stepId.SetTargets,
          name: t("wizard.terms.setTargets"),
          component: <SetTargets />,
          enableNext: targets.length > 0,
          canJumpTo: stepIdReached >= stepId.SetTargets,
        },
        {
          id: stepId.Scope,
          name: t("wizard.terms.scope"),
          component: <SetScope />,
          canJumpTo: stepIdReached >= stepId.Scope,
        },
      ],
    },
    {
      name: t("wizard.terms.advanced"),
      steps: [
        {
          id: stepId.CustomRules,
          name: t("wizard.terms.customRules"),
          component: <CustomRules />,
          canJumpTo: stepIdReached >= stepId.CustomRules,
        },
        {
          id: stepId.Options,
          name: t("wizard.terms.options"),
          component: <SetOptions />,
          enableNext: targets.length > 0,
          canJumpTo: stepIdReached >= stepId.Options,
        },
      ],
    },
    {
      id: stepId.Review,
      name: t("wizard.terms.review"),
      component: <Review applications={applications} mode={mode} />,
      nextButtonText: "Run",
      canJumpTo: stepIdReached >= stepId.Review,
    },
  ];

  return (
    <>
      {isOpen && (
        <FormProvider {...methods}>
          <Wizard
            isOpen={isOpen}
            title="Application analysis"
            description={
              <Truncate
                content={applications.map((app) => app.name).join(", ")}
              />
            }
            navAriaLabel={`${title} steps`}
            mainAriaLabel={`${title} content`}
            steps={steps}
            onNext={onMove}
            onBack={onMove}
            onSave={handleSubmit(onSubmit)}
            onClose={() => {
              handleClose();
            }}
          />
        </FormProvider>
      )}
    </>
  );
};
