import React, { useState } from 'react';
import { Plus, Clock, MapPin, User, AlertTriangle, Calendar, Brain, Settings, Zap } from 'lucide-react';
import { FixedCommitment, TimeRange, UserSettings, StudyPlan } from '../types';
import { checkCommitmentConflicts } from '../utils/scheduling';

// Utility function to convert hour number to HH:MM format
const formatHour = (hour: number): string => {
  return hour.toString().padStart(2, '0') + ':00';
};

interface FixedCommitmentInputProps {
  onAddCommitment: (commitment: Omit<FixedCommitment, 'id' | 'createdAt'>) => void;
  existingCommitments: FixedCommitment[];
  settings: UserSettings;
  existingPlans: StudyPlan[];
}

const FixedCommitmentInput: React.FC<FixedCommitmentInputProps> = ({
  onAddCommitment,
  existingCommitments,
  settings,
  existingPlans
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [commitmentType, setCommitmentType] = useState<'fixed' | 'one-time'>('fixed');
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    recurring: true,
    daysOfWeek: [] as number[],
    specificDates: [] as string[],
    category: 'Academics',
    location: '',
    description: '',
    isAllDay: false,
    countsTowardDailyHours: false,
    dateRange: {
      startDate: '',
      endDate: ''
    }
  });

  const [conflictError, setConflictError] = useState<string | null>(null);

  // Enhanced validation for fixed commitments
  const isTitleValid = formData.title.trim().length > 0;
  const isTitleLengthValid = formData.title.trim().length <= 100;
  const isStartTimeValid = formData.isAllDay || formData.startTime.trim().length > 0;
  const isEndTimeValid = formData.isAllDay || formData.endTime.trim().length > 0;
  const isDaysValid = formData.recurring ? formData.daysOfWeek.length > 0 : true;
  const isDatesValid = !formData.recurring ? formData.specificDates.length > 0 : true;
  const isTimeRangeValid = formData.isAllDay || !formData.startTime || !formData.endTime ||
    formData.startTime < formData.endTime;
  const isLocationValid = !formData.location || formData.location.trim().length <= 200;
  const isDateRangeValid = !formData.recurring || !formData.dateRange.startDate || !formData.dateRange.endDate ||
    formData.dateRange.startDate <= formData.dateRange.endDate;

  const isFormValid = isTitleValid && isTitleLengthValid && isDaysValid &&
                          isDatesValid && isTimeRangeValid && isLocationValid && isDateRangeValid &&
                          (formData.isAllDay || (isStartTimeValid && isEndTimeValid));



  const daysOfWeekOptions = [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 0, label: 'Sun' }
  ];


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setConflictError(null);

    // Handle fixed commitment submission
    const conflictCheck = checkCommitmentConflicts(formData, existingCommitments);

    if (conflictCheck.hasConflict) {
      const conflictingCommitment = conflictCheck.conflictingCommitment!;
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      let conflictDescription = '';

      if (conflictingCommitment.recurring) {
        const conflictingDays = conflictingCommitment.daysOfWeek.map(day => dayNames[day]).join(', ');
        conflictDescription = `(${conflictingDays}, ${conflictingCommitment.startTime}-${conflictingCommitment.endTime})`;
      } else {
        const conflictingDates = conflictingCommitment.specificDates?.map(date => new Date(date).toLocaleDateString()).join(', ') || '';
        conflictDescription = `(${conflictingDates}, ${conflictingCommitment.startTime}-${conflictingCommitment.endTime})`;
      }

      if (conflictCheck.conflictType === 'strict') {
        setConflictError(
          `Time conflict with "${conflictingCommitment.title}" ${conflictDescription}. Please adjust your schedule.`
        );
        return;
      } else if (conflictCheck.conflictType === 'override') {
        if (!formData.recurring) {
          setConflictError(
            `This one-time commitment will override the recurring commitment "${conflictingCommitment.title}" on the selected dates.`
          );
        } else {
          const conflictingDates = conflictCheck.conflictingDates?.map(date => new Date(date).toLocaleDateString()).join(', ') || '';
          setConflictError(
            `This recurring commitment conflicts with one-time commitments on: ${conflictingDates}. These dates will be excluded from the recurring schedule.`
          );
        }
      }
    }

    const commitmentData = {
      ...formData,
      type: 'fixed' as const,
      startTime: formData.isAllDay ? undefined : formData.startTime,
      endTime: formData.isAllDay ? undefined : formData.endTime,
      dateRange: (formData.recurring && formData.dateRange.startDate && formData.dateRange.endDate)
        ? formData.dateRange
        : undefined
    };

    onAddCommitment(commitmentData);

    // Reset form
    setFormData({
      title: '',
      startTime: '',
      endTime: '',
      recurring: true,
      daysOfWeek: [],
      specificDates: [],
      category: 'Academics',
      location: '',
      description: '',
      isAllDay: false,
      countsTowardDailyHours: false,
      dateRange: {
        startDate: '',
        endDate: ''
      }
    });
    setIsOpen(false);
  };

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort()
    }));
  };



  return (
    <div className="bg-white rounded-xl shadow-lg p-6 dark:bg-gray-900 dark:shadow-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Add Commitment
        </h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 add-commitment-button"
        >
          <Plus size={20} />
          <span>Add Commitment</span>
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="e.g., Linear Algebra Lecture"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                Category
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value
                    })
                  }
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="Academics">Academics</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Health">Health</option>
                  <option value="Learning">Learning</option>
                  <option value="Finance">Finance</option>
                  <option value="Home">Home</option>
                  <option value="Organization">Organization</option>
                  <option value="Routine">Routine</option>
                  <option value="Buffer">Buffer</option>
                </select>
              </div>
                      </div>
        </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                Recurrence Pattern
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="recurring"
                    checked={formData.recurring}
                    onChange={() => setFormData({ ...formData, recurring: true, specificDates: [] })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Recurring</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="recurring"
                    checked={!formData.recurring}
                    onChange={() => setFormData({ ...formData, recurring: false, daysOfWeek: [] })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">One-time</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={formData.isAllDay}
                onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>All-day event (no specific time)</span>
            </label>
          </div>

        {!formData.isAllDay && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                Start Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input
                  type="time"
                  required={!formData.isAllDay}
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                End Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input
                  type="time"
                  required={!formData.isAllDay}
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

                  {formData.recurring ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                Days of Week
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeekOptions.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      formData.daysOfWeek.includes(day.value)
                        ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                Date Range (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 dark:text-gray-400">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    <input
                      type="date"
                      value={formData.dateRange.startDate}
                      onChange={(e) => setFormData({
                        ...formData,
                        dateRange: {
                          ...formData.dateRange,
                          startDate: e.target.value
                        }
                      })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 dark:text-gray-400">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    <input
                      type="date"
                      value={formData.dateRange.endDate}
                      onChange={(e) => setFormData({
                        ...formData,
                        dateRange: {
                          ...formData.dateRange,
                          endDate: e.target.value
                        }
                      })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                If no date range is specified, the commitment will recur indefinitely.
              </p>
            </div>
          </div>
        ) : !formData.recurring ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
              Specific Dates
            </label>
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="text-blue-500 dark:text-blue-400" size={20} />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Select dates for this commitment</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Choose each date when this commitment occurs.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="date"
                    key={formData.specificDates.length} // This will reset the input after each date is added
                    min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
                    onChange={(e) => {
                      if (e.target.value && !formData.specificDates.includes(e.target.value)) {
                        setFormData({
                          ...formData,
                          specificDates: [...formData.specificDates, e.target.value].sort()
                        });
                        // Reset the input by changing its key (handled above)
                      }
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="Select a date"
                  />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Click to add</span>
              </div>

              {formData.specificDates.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Selected Dates ({formData.specificDates.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, specificDates: [] })}
                      className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {formData.specificDates.map((date) => (
                      <div
                        key={date}
                        className="flex items-center justify-between bg-blue-100 text-blue-800 px-3 py-2 rounded-lg dark:bg-blue-900/20 dark:text-blue-300"
                      >
                        <span className="text-sm font-medium">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            specificDates: formData.specificDates.filter(d => d !== date)
                          })}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-bold text-lg leading-none"
                          title="Remove this date"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

          <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
              Location (Optional)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="e.g., Room 101, Main Building"
              />
            </div>
          </div>

          <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              rows={2}
              placeholder="Additional notes about this commitment..."
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.countsTowardDailyHours}
                onChange={(e) => setFormData({ ...formData, countsTowardDailyHours: e.target.checked })}
                className="mt-1 text-blue-600 focus:ring-blue-500 rounded"
              />
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Count toward daily available hours
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Check this for work/productive commitments that use your daily capacity (e.g., meetings, study sessions).
                  Leave unchecked for personal activities (e.g., meals, commute, exercise).
                </span>
              </div>
            </label>
          </div>

          {/* Conflict Error Display */}
          {conflictError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-700">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="text-red-500 mt-0.5" size={16} />
                <span className="text-sm text-red-700 dark:text-red-300">{conflictError}</span>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={!isFormValid}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
              <span>
                Add Commitment
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FixedCommitmentInput;
