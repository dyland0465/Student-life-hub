import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type {
  SchedulePreset,
  GeneratedSchedule,
  RegistrationQueue,
} from '@/types';
import { CourseSearch } from '@/components/schedule/CourseSearch';
import { PresetSelector } from '@/components/schedule/PresetSelector';
import { SchedulePreview } from '@/components/schedule/SchedulePreview';
import { RegistrationQueue as RegistrationQueueComponent } from '@/components/schedule/RegistrationQueue';
import { LionPathConnectionDialog } from '@/components/schedule/LionPathConnectionDialog';
import { Loader2, Calendar, Sparkles, Wand2 } from 'lucide-react';

export function ScheduleBuilderPage() {
  const { currentUser, studentProfile } = useAuth();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  
  // Course selection
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [requiredCourses, setRequiredCourses] = useState<string[]>([]);
  
  // Presets
  const [presets, setPresets] = useState<SchedulePreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<SchedulePreset | null>(null);
  
  // Generated schedule
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedSchedule | null>(null);
  
  // Registration queue
  const [registrationQueue, setRegistrationQueue] = useState<RegistrationQueue[]>([]);
  const [lionPathConnected, setLionPathConnected] = useState(false);
  const [showLionPathDialog, setShowLionPathDialog] = useState(false);
  
  // Semester
  const [semester, setSemester] = useState('Fall 2024');

  useEffect(() => {
    if (currentUser) {
      loadPresets();
      loadRegistrationQueue();
      checkLionPathStatus();
    }
  }, [currentUser]);

  async function loadPresets() {
    try {
      const data = await api.getPresets();
      setPresets(data);
    } catch (error: any) {
      console.error('Error loading presets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load presets',
        variant: 'destructive',
      });
    }
  }

  async function loadRegistrationQueue() {
    try {
      const data = await api.getRegistrationQueue();
      setRegistrationQueue(data);
    } catch (error: any) {
      console.error('Error loading registration queue:', error);
    }
  }

  async function checkLionPathStatus() {
    try {
      const data = await api.getLionPathStatus();
      setLionPathConnected(data.connected);
    } catch (error: any) {
      console.error('Error checking LionPath status:', error);
    }
  }

  function handleCourseSelect(courseCode: string) {
    if (!selectedCourses.includes(courseCode)) {
      setSelectedCourses([...selectedCourses, courseCode]);
    }
  }

  function handleCourseRemove(courseCode: string) {
    setSelectedCourses(selectedCourses.filter(c => c !== courseCode));
    setRequiredCourses(requiredCourses.filter(c => c !== courseCode));
  }

  function handleRequiredCourseAdd(courseCode: string) {
    if (!requiredCourses.includes(courseCode)) {
      setRequiredCourses([...requiredCourses, courseCode]);
    }
  }

  function handleAutoPopulateCourses() {
    if (!studentProfile?.major) {
      toast({
        title: 'Error',
        description: 'Please set your major in your profile settings',
        variant: 'destructive',
      });
      return;
    }

    const major = studentProfile.major.toLowerCase();
    const year = studentProfile.year || 1;
    const suggestedCourses: string[] = [];

    // Map majors to suggested courses based on year
    if (major.includes('computer') || major.includes('cs') || major.includes('comp sci')) {
      // Computer Science courses
      if (year === 1) {
        suggestedCourses.push('CMPSC 131', 'MATH 140', 'ENGL 15');
      } else if (year === 2) {
        suggestedCourses.push('CMPSC 132', 'MATH 141', 'STAT 200');
      } else if (year === 3) {
        suggestedCourses.push('CMPSC 360', 'CMPSC 465');
      } else {
        suggestedCourses.push('CMPSC 360', 'CMPSC 465');
      }
    } else if (major.includes('engineering') || major.includes('engr')) {
      // Engineering courses
      if (year === 1) {
        suggestedCourses.push('MATH 140', 'CHEM 110', 'ENGL 15');
      } else if (year === 2) {
        suggestedCourses.push('MATH 141', 'PHYS 211', 'STAT 200');
      } else {
        suggestedCourses.push('MATH 141', 'PHYS 211');
      }
    } else if (major.includes('business') || major.includes('finance') || major.includes('accounting')) {
      // Business courses
      if (year === 1) {
        suggestedCourses.push('MATH 140', 'ENGL 15', 'ECON 102');
      } else {
        suggestedCourses.push('STAT 200', 'ECON 102');
      }
    } else if (major.includes('biology') || major.includes('bio')) {
      // Biology courses
      if (year === 1) {
        suggestedCourses.push('BIOL 110', 'CHEM 110', 'MATH 140');
      } else {
        suggestedCourses.push('BIOL 110', 'CHEM 110');
      }
    } else {
      // General/Other majors - suggest common gen-ed courses
      if (year === 1) {
        suggestedCourses.push('ENGL 15', 'MATH 140');
      } else if (year === 2) {
        suggestedCourses.push('MATH 141', 'STAT 200');
      } else {
        suggestedCourses.push('STAT 200');
      }
    }

    // Add suggested courses that aren't already selected
    const newCourses = suggestedCourses.filter(
      course => !requiredCourses.includes(course) && !selectedCourses.includes(course)
    );

    if (newCourses.length === 0) {
      toast({
        title: 'Info',
        description: 'All suggested courses are already added',
      });
      return;
    }

    // Add to both selected and required courses
    setSelectedCourses([...selectedCourses, ...newCourses]);
    setRequiredCourses([...requiredCourses, ...newCourses]);

    toast({
      title: 'Success',
      description: `Added ${newCourses.length} suggested course${newCourses.length > 1 ? 's' : ''} based on your major`,
    });
  }

  async function handleGenerateSchedule() {
    if (requiredCourses.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one required course',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedPreset) {
      toast({
        title: 'Error',
        description: 'Please select a preset',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const schedule = await api.generateSchedule({
        semester,
        requiredCourses,
        selectedCourses,
        presetId: selectedPreset.id,
        parameters: selectedPreset.parameters,
      });
      
      setGeneratedSchedule(schedule);
      toast({
        title: 'Success',
        description: 'Schedule generated successfully!',
      });
    } catch (error: any) {
      console.error('Error generating schedule:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate schedule',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleAddToQueue() {
    if (!generatedSchedule) return;

    if (!lionPathConnected) {
      setShowLionPathDialog(true);
      return;
    }

    try {
      const registrationDate = new Date();
      registrationDate.setDate(registrationDate.getDate() + 7);

      await api.addToRegistrationQueue(
        generatedSchedule.id,
        generatedSchedule.sections,
        registrationDate.toISOString()
      );

      toast({
        title: 'Success',
        description: 'Added to registration queue',
      });

      loadRegistrationQueue();
    } catch (error: any) {
      console.error('Error adding to queue:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add to registration queue',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Schedule Builder</h2>
          <p className="text-muted-foreground">
            Let's create your perfect class schedule for next semester
          </p>
        </div>
        {!lionPathConnected && (
          <Button variant="outline" onClick={() => setShowLionPathDialog(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            Connect LionPath
          </Button>
        )}
        {lionPathConnected && (
          <Badge variant="secondary" className="px-3 py-1">
            LionPath Connected
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Course Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Courses</CardTitle>
              <CardDescription>
                Search and select the courses you need for next semester
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseSearch
                onCourseSelect={handleCourseSelect}
                selectedCourses={selectedCourses}
                requiredCourses={requiredCourses}
                onRequiredCourseAdd={handleRequiredCourseAdd}
                onCourseRemove={handleCourseRemove}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Required Courses</CardTitle>
                  <CardDescription>
                    Courses you must take
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoPopulateCourses}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Auto-Fill
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {requiredCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No required courses selected. Add courses from the search above.
                </p>
              ) : (
                <div className="space-y-2">
                  {requiredCourses.map(courseCode => (
                    <div
                      key={courseCode}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <span className="font-medium">{courseCode}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCourseRemove(courseCode)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preset Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Preset</CardTitle>
              <CardDescription>
                {studentProfile?.isPro
                  ? 'Choose a preset or create a custom one'
                  : 'Choose from free presets'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PresetSelector
                presets={presets}
                selectedPreset={selectedPreset}
                onPresetSelect={setSelectedPreset}
                isPro={studentProfile?.isPro || false}
                onPresetsChange={loadPresets}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Semester</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="Fall 2024">Fall 2025</option>
                <option value="Spring 2025">Spring 2026</option>
                <option value="Summer 2025">Summer 2026</option>
              </select>
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerateSchedule}
            disabled={generating || requiredCourses.length === 0 || !selectedPreset}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Schedule...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Optimal Schedule
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Generated Schedule Preview */}
      {generatedSchedule && (
        <SchedulePreview
          schedule={generatedSchedule}
          onAddToQueue={handleAddToQueue}
          onRegenerate={handleGenerateSchedule}
          lionPathConnected={lionPathConnected}
        />
      )}

      {/* Registration Queue */}
      {registrationQueue.length > 0 && (
        <RegistrationQueueComponent
          queue={registrationQueue}
          onRefresh={loadRegistrationQueue}
        />
      )}

      {/* LionPath Connection Dialog */}
      <LionPathConnectionDialog
        open={showLionPathDialog}
        onOpenChange={setShowLionPathDialog}
        onConnected={() => {
          setLionPathConnected(true);
          checkLionPathStatus();
        }}
      />
    </div>
  );
}

