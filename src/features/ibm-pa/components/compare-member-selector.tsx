"use client";

import type { ReactNode } from "react";

import { Select } from "@/components/ui/select";
import { getMemberSemanticDescriptor } from "@/features/ibm-pa/lib/semantic";
import type { Tm1Member } from "@/shared/types/ibm-pa";

type CompareMemberSelectorProps = {
  disabled?: boolean | undefined;
  label: string;
  members: Tm1Member[];
  onChange: (value: string) => void;
  value: string;
};

const CompareMemberSelector = ({
  disabled,
  label,
  members,
  onChange,
  value,
}: CompareMemberSelectorProps): ReactNode => {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <Select
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        value={value}
      >
        {members.map((member) => (
          <option key={member.uniqueName ?? member.name} value={member.name}>
            {getMemberSemanticDescriptor(member).displayLabel}
          </option>
        ))}
      </Select>
    </label>
  );
};

export { CompareMemberSelector };
