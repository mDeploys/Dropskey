"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCcw, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { getGoogleMerchantStatus, syncProductsToGoogleMerchant } from "@/app/admin/products/google-merchant-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MerchantStatus {
  configured: boolean;
  missingEnvVars: string[];
  accountId: string | null;
  dataSourceDisplayName: string;
  feedLabel: string;
  contentLanguage: string;
  targetCountries: string[];
  currencyCode: string;
  dataSourceFound: boolean;
  dataSourceName: string | null;
}

interface SyncSummary {
  syncedCount: number;
  failedCount: number;
  dataSourceCreated: boolean;
  dataSourceName: string;
  failures: Array<{ productId: number; productName: string; message: string }>;
}

export function GoogleMerchantSyncCard() {
  const [status, setStatus] = useState<MerchantStatus | null>(null);
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadStatus = async () => {
    setIsLoadingStatus(true);
    setStatusError(null);

    const result = await getGoogleMerchantStatus();
    if (result.error) {
      setStatus(null);
      setStatusError(result.error);
      setIsLoadingStatus(false);
      return;
    }

    setStatus(result.data);
    setIsLoadingStatus(false);
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSummary(null);
    const toastId = toast.loading("Syncing products to Google Merchant...");

    const result = await syncProductsToGoogleMerchant();
    setIsSyncing(false);

    if (result.error || !result.data) {
      toast.error(result.error || "Failed to sync products to Google Merchant.", { id: toastId });
      return;
    }

    setSummary(result.data);
    toast.success(
      `${result.data.syncedCount} product${result.data.syncedCount === 1 ? "" : "s"} synced to Google Merchant.`,
      { id: toastId }
    );
    await loadStatus();
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl">Google Merchant API</CardTitle>
          <CardDescription>
            Upload your website products to Merchant Center using a primary API data source.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={loadStatus} disabled={isLoadingStatus || isSyncing}>
            {isLoadingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Refresh Status
          </Button>
          <Button type="button" onClick={handleSync} disabled={isLoadingStatus || isSyncing || !status?.configured}>
            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            Sync All Products
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {statusError ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to check Google Merchant</AlertTitle>
            <AlertDescription>{statusError}</AlertDescription>
          </Alert>
        ) : null}

        {status ? (
          <>
            {!status.configured ? (
              <Alert variant="destructive">
                <AlertTitle>Missing configuration</AlertTitle>
                <AlertDescription>
                  Add these server env vars before syncing: {status.missingEnvVars.join(", ")}.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertTitle>Merchant Center mapping</AlertTitle>
                <AlertDescription>
                  This sync targets <strong>{status.targetCountries.join(", ")}</strong> with feed label{" "}
                  <strong>{status.feedLabel}</strong>, language <strong>{status.contentLanguage}</strong>, and currency{" "}
                  <strong>{status.currencyCode}</strong>.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Merchant Account</p>
                <p className="mt-1 font-medium">{status.accountId || "Not set"}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">API Data Source Name</p>
                <p className="mt-1 font-medium">{status.dataSourceDisplayName}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Target Market</p>
                <p className="mt-1 font-medium">{status.targetCountries.join(", ")}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Data Source Status</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={status.dataSourceFound ? "default" : "outline"}>
                    {status.dataSourceFound ? "Found" : "Will Create on Sync"}
                  </Badge>
                </div>
                {status.dataSourceName ? <p className="mt-2 text-xs text-muted-foreground">{status.dataSourceName}</p> : null}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Merchant Center can take several minutes to process uploaded products after the API request succeeds.
            </p>
          </>
        ) : null}

        {summary ? (
          <Alert variant={summary.failedCount > 0 ? "destructive" : "default"}>
            <AlertTitle>Latest sync result</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Synced {summary.syncedCount} product{summary.syncedCount === 1 ? "" : "s"}.
                {summary.failedCount > 0 ? ` ${summary.failedCount} failed.` : " No failures."}
              </p>
              <p>Data source: {summary.dataSourceName}{summary.dataSourceCreated ? " (created during sync)" : ""}</p>
              {summary.failures.length > 0 ? (
                <div className="space-y-1">
                  {summary.failures.slice(0, 5).map((failure) => (
                    <p key={failure.productId}>
                      #{failure.productId} {failure.productName}: {failure.message}
                    </p>
                  ))}
                  {summary.failures.length > 5 ? <p>More failures exist. Review Merchant Center and server logs.</p> : null}
                </div>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
