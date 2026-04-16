import React from 'react';

type StatusBarProps = Readonly<{
  networkStatus?: string;
  vmLabel?: string;
  solcVersion?: string;
}>;

export const StatusBar: React.FC<StatusBarProps> = ({ networkStatus = 'ONLINE', vmLabel = 'BROWSER VM' }) => {
  return (
    <footer className="h-6 bg-background border-t border-border flex items-center px-3 justify-between shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-sans text-[9px] font-bold text-muted-foreground">NETWORK STATUS: {networkStatus}</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="font-sans text-[9px] font-bold text-muted-foreground uppercase">{vmLabel}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[9px] font-bold text-muted-foreground">
        <span>EVM LENS library</span>
      </div>
    </footer>
  );
};
