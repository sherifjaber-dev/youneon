"use client";

import React, { useState } from "react";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { PRODUCT_CONFIG } from "@/lib/product-config";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function GiftShopButton() {
  const { products, sdk, restoredPurchases } = usePiAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const product = products?.find(
    (p) => p.id === PRODUCT_CONFIG.PRODUCT_69daaa85b91f3a5af8ec7c8a
  );

  if (!product) {
    return (
      <Button disabled variant="outline">
        Shop Unavailable
      </Button>
    );
  }

  const handlePurchase = async () => {
    if (!sdk) {
      setErrorMessage("SDK not initialized");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      console.log("[GiftShop] Starting purchase for product:", product.slug);
      const result = await sdk.makePurchase(product.slug);

      if (result.ok) {
        console.log("[GiftShop] Purchase successful:", result);
        setSuccessMessage(
          `Successfully purchased ${product.name}! Transaction ID: ${result.txid}`
        );
        setShowDialog(false);

        // Reset success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage("Purchase failed");
      }
    } catch (err: any) {
      console.error("[GiftShop] Purchase error:", err);
      const errorCode = err?.code;

      if (errorCode === "purchase_cancelled") {
        setErrorMessage("Purchase cancelled by user");
      } else if (errorCode === "product_not_found") {
        setErrorMessage("Product not found");
      } else if (errorCode === "purchase_error") {
        setErrorMessage("An error occurred during purchase. Please try again.");
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : "Purchase failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="default"
        className="gap-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Spinner className="h-4 w-4" />
            Processing...
          </>
        ) : (
          <>
            💎 Shop ({product.price_in_pi} Pi)
          </>
        )}
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{product.name}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{product.description}</p>
              <p className="font-semibold text-foreground">
                Price: {product.price_in_pi} Pi
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorMessage && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurchase}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Processing...
                </>
              ) : (
                "Confirm Purchase"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
