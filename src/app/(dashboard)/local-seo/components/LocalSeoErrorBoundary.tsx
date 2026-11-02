"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  tabName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class LocalSeoErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || "An unexpected error occurred" };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Local SEO Tab Error [${this.props.tabName || "Tab"}]:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center max-w-xl mx-auto my-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Unable to load {this.props.tabName || "this tab"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              A temporary issue occurred while rendering this section. Click below to retry or switch to another tab.
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={this.handleRetry}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs px-4 py-2 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Retry Tab
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
