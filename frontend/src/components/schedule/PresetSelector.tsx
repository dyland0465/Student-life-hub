import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CustomPresetBuilder } from './CustomPresetBuilder';
import type { SchedulePreset } from '@/types';
import { Sparkles, Settings } from 'lucide-react';

interface PresetSelectorProps {
  presets: SchedulePreset[];
  selectedPreset: SchedulePreset | null;
  onPresetSelect: (preset: SchedulePreset) => void;
  isPro: boolean;
  onPresetsChange: () => void;
}

export function PresetSelector({
  presets,
  selectedPreset,
  onPresetSelect,
  isPro,
  onPresetsChange,
}: PresetSelectorProps) {
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  const freePresets = presets.filter(p => p.type === 'free');
  const customPresets = presets.filter(p => p.type === 'custom');

  return (
    <div className="space-y-4">
      {/* Free Presets */}
      <div>
        <h4 className="text-sm font-medium mb-2">Free Presets</h4>
        <div className="grid gap-2">
          {freePresets.map((preset) => (
            <Card
              key={preset.id}
              className={`cursor-pointer transition-colors ${
                selectedPreset?.id === preset.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-accent'
              }`}
              onClick={() => onPresetSelect(preset)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{preset.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {preset.parameters.prioritizeEasyProfessors && 'Easy professors • '}
                      {preset.parameters.prioritizeLateStart && 'Late start • '}
                      {preset.parameters.prioritizeEarlyEnd && 'Early end'}
                    </p>
                  </div>
                  {selectedPreset?.id === preset.id && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Presets (Pro only) */}
      {isPro && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Custom Presets</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCustomBuilder(true)}
            >
              <Settings className="h-3 w-3 mr-1" />
              Create Custom
            </Button>
          </div>
          {customPresets.length > 0 ? (
            <div className="grid gap-2">
              {customPresets.map((preset) => (
                <Card
                  key={preset.id}
                  className={`cursor-pointer transition-colors ${
                    selectedPreset?.id === preset.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => onPresetSelect(preset)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{preset.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            Custom
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Personalized optimization
                        </p>
                      </div>
                      {selectedPreset?.id === preset.id && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No custom presets. Create one to get started!
            </p>
          )}
        </div>
      )}

      {!isPro && (
        <div className="rounded-lg bg-muted p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">
              Upgrade to Pro to create custom presets with adjustable parameters
            </p>
          </div>
        </div>
      )}

      <CustomPresetBuilder
        open={showCustomBuilder}
        onOpenChange={setShowCustomBuilder}
        onPresetCreated={onPresetsChange}
      />
    </div>
  );
}

