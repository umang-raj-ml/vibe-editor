import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

import type { TemplateFolder } from "../lib/path-to-json";
import { getPlaygroundById, SaveUpdatedCode } from "../actions";

interface PlaygroundData {
  id: string;
  title?: string;
  [key: string]: any;
}
interface UsePlaygroundReturn {
  playgroundData: PlaygroundData | null;
  templateData: TemplateFolder | null;
  isLoading: boolean;
  error: string | null;
  loadPlayground: () => Promise<void>;
  saveTemplateData: (data: TemplateFolder) => Promise<void>;
}

export const usePlayground = (id: string): UsePlaygroundReturn => {
  const [playgroundData, setPlaygroundData] = useState<PlaygroundData | null>(
    null
  );
  const [templateData, setTemplateData] = useState<TemplateFolder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlayground = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);

      const data = await getPlaygroundById(id);
      //@ts-ignore
      setPlaygroundData(data);
      const rawContent = data?.templateFiles?.[0]?.content;

      if (typeof rawContent === "string") {
        const parsedContent = JSON.parse(rawContent);
        setTemplateData(parsedContent);
        toast.success("Playground loaded successfully");
        return;
      }

      const res = await fetch(`/api/templates/${id}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch template data: ${res.status}`);
      }
      const templateRes = await res.json();

      if (templateRes.templateJson && Array.isArray(templateRes.templateJson)) {
        setTemplateData({
          folderName: "Root",
          items: templateRes.templateJson,
        });
      } else {
        setTemplateData(
          templateRes.templateJson || {
            folderName: "Root",
            items: [],
          }
        );
      }
      toast.success("Template loaded successfully");
    } catch (error) {
        console.error("Failed to load playground", error);
        setError("Failed to load playground");
        toast.error("Failed to load playground");
    }
    finally{
        setIsLoading(false);
    }
  }, [id]);

  const saveTemplateData = useCallback(async(data:TemplateFolder)=>{
    try {
      await SaveUpdatedCode(id, data);
      setTemplateData(data);
      toast.success("Changes saved successfully");
    } catch (error) {
         console.error("Error saving template data:", error);
      toast.error("Failed to save changes");
      throw error;
    }
  },[id])

  useEffect(()=>{
    loadPlayground()
  },[loadPlayground])

    return {
    playgroundData,
    templateData,
    isLoading,
    error,
    loadPlayground,
    saveTemplateData,
  };
};
