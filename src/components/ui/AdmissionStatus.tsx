"use client";

import { CheckCircle, Clock, XCircle } from "lucide-react";

interface AdmissionStatusProps {
  status: "PENDING" | "APPROVED" | "REJECTED";
  referenceNumber: string;
  approvedAt?: string;
}

export default function AdmissionStatus({ status, referenceNumber, approvedAt }: AdmissionStatusProps) {
  const statusConfig = {
    PENDING: {
      icon: Clock,
      label: "Pending Review",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      description: "Your application is being reviewed by our admissions team.",
    },
    APPROVED: {
      icon: CheckCircle,
      label: "Approved",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Congratulations! Your admission has been approved. You can now access the full student portal.",
    },
    REJECTED: {
      icon: XCircle,
      label: "Not Approved",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Unfortunately, your application was not approved. Please contact admissions for more information.",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`${config.color} mt-0.5 flex-shrink-0`} size={20} />
        <div className="flex-1">
          <h3 className={`${config.color} font-semibold text-sm`}>{config.label}</h3>
          <p className="text-gray-600 text-sm mt-1">{config.description}</p>
          <p className="text-gray-500 text-xs mt-2">Reference: {referenceNumber}</p>
          {approvedAt && (
            <p className="text-gray-500 text-xs">
              Approved on: {new Date(approvedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
