import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Stethoscope, FileText, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
  available: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const doctors: Doctor[] = [
  { id: '1', name: 'Dr. James Mwangi', specialty: 'General Practice', available: true },
  { id: '2', name: 'Dr. Sarah Odhiambo', specialty: 'Pediatrics', available: true },
  { id: '3', name: 'Dr. Michael Kariuki', specialty: 'Internal Medicine', available: false },
  { id: '4', name: 'Dr. Faith Njeri', specialty: 'Obstetrics & Gynecology', available: true },
  { id: '5', name: 'Dr. David Otieno', specialty: 'Cardiology', available: true },
  { id: '6', name: 'Dr. Agnes Wambui', specialty: 'Dermatology', available: true },
];

const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 8; hour < 17; hour++) {
    for (const minute of ['00', '30']) {
      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
      slots.push({
        time,
        available: Math.random() > 0.3,
      });
    }
  }
  return slots;
};

interface AppointmentBookProps {
  patientId?: string;
  patientName?: string;
  onSuccess?: (appointment: { date: string; time: string; doctor: Doctor }) => void;
  onCancel?: () => void;
}

export const AppointmentBook: React.FC<AppointmentBookProps> = ({
  patientId,
  patientName,
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeSlots] = useState<TimeSlot[]>(generateTimeSlots());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  const isDateSelectable = (day: number): boolean => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today && date.getDay() !== 0; // Not in past and not Sunday
  };

  const handleDateSelect = (day: number) => {
    if (isDateSelectable(day)) {
      setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const today = new Date();
    const prevMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (prevMonthDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(prevMonthDate);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select a doctor, date, and time.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Appointment Booked Successfully',
        description: `Appointment scheduled with ${selectedDoctor.name} on ${selectedDate.toLocaleDateString()} at ${selectedTime}`,
      });

      if (onSuccess) {
        onSuccess({
          date: selectedDate.toISOString(),
          time: selectedTime,
          doctor: selectedDoctor,
        });
      }
    } catch {
      toast({
        title: 'Booking Failed',
        description: 'An error occurred while booking the appointment.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Stethoscope className="w-5 h-5 text-primary-blue" />
        Select Doctor
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {doctors.map((doctor) => (
          <motion.div
            key={doctor.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => doctor.available && setSelectedDoctor(doctor)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedDoctor?.id === doctor.id
                ? 'border-primary-blue bg-primary-blue/5'
                : doctor.available
                ? 'border-gray-200 hover:border-primary-blue/50'
                : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-blue/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary-blue" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{doctor.name}</h4>
                <p className="text-sm text-gray-600">{doctor.specialty}</p>
              </div>
              {selectedDoctor?.id === doctor.id && (
                <Check className="w-5 h-5 text-primary-blue" />
              )}
            </div>
            <div className="mt-2">
              <Badge variant={doctor.available ? 'default' : 'secondary'} className={doctor.available ? 'bg-success-green' : ''}>
                {doctor.available ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary-blue" />
        Select Date
      </h3>

      {/* Calendar */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h4 className="font-semibold">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h4>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-2 font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {Array.from({ length: startingDay }).map((_, i) => (
            <div key={`empty-${i}`} className="py-2" />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isSelected = selectedDate?.getDate() === day &&
              selectedDate?.getMonth() === currentMonth.getMonth() &&
              selectedDate?.getFullYear() === currentMonth.getFullYear();
            const selectable = isDateSelectable(day);
            
            return (
              <motion.div
                key={day}
                whileHover={selectable ? { scale: 1.1 } : {}}
                whileTap={selectable ? { scale: 0.95 } : {}}
                onClick={() => handleDateSelect(day)}
                className={`py-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary-blue text-white'
                    : selectable
                    ? 'hover:bg-primary-blue/10'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                {day}
              </motion.div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <p className="text-center text-gray-600">
          Selected: <strong>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
        </p>
      )}
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary-blue" />
        Select Time
      </h3>

      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
        {timeSlots.map((slot) => (
          <motion.div
            key={slot.time}
            whileHover={slot.available ? { scale: 1.05 } : {}}
            whileTap={slot.available ? { scale: 0.95 } : {}}
            onClick={() => slot.available && setSelectedTime(slot.time)}
            className={`py-3 px-2 rounded-lg text-center cursor-pointer transition-all text-sm ${
              selectedTime === slot.time
                ? 'bg-primary-blue text-white'
                : slot.available
                ? 'bg-gray-100 hover:bg-primary-blue/10'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
            }`}
          >
            {slot.time}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary-blue" />
        Appointment Details
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Appointment Type
        </label>
        <select
          value={appointmentType}
          onChange={(e) => setAppointmentType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
        >
          <option value="">Select type</option>
          <option value="consultation">General Consultation</option>
          <option value="follow-up">Follow-up Visit</option>
          <option value="checkup">Routine Checkup</option>
          <option value="emergency">Emergency</option>
          <option value="procedure">Procedure/Treatment</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent resize-none"
          placeholder="Any additional notes or symptoms to mention..."
        />
      </div>

      {/* Summary */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <h4 className="font-semibold mb-3">Appointment Summary</h4>
          <div className="space-y-2 text-sm">
            {patientName && (
              <div className="flex justify-between">
                <span className="text-gray-600">Patient:</span>
                <span className="font-medium">{patientName}</span>
              </div>
            )}
            {patientId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Patient ID:</span>
                <span className="font-medium">{patientId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Doctor:</span>
              <span className="font-medium">{selectedDoctor?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Specialty:</span>
              <span className="font-medium">{selectedDoctor?.specialty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time:</span>
              <span className="font-medium">{selectedTime}</span>
            </div>
            {appointmentType && (
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{appointmentType.replace('-', ' ')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary-blue" />
          Book Appointment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  s === step
                    ? 'bg-primary-blue text-white'
                    : s < step
                    ? 'bg-success-green text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div className={`w-12 md:w-20 h-1 mx-1 ${s < step ? 'bg-success-green' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="mb-4">
          <Badge variant="outline">
            Step {step} of 4: {
              step === 1 ? 'Select Doctor' :
              step === 2 ? 'Choose Date' :
              step === 3 ? 'Pick Time' :
              'Confirm Details'
            }
          </Badge>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <div className="flex justify-between mt-8">
          <div>
            {onCancel && step === 1 && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
          </div>

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !selectedDoctor) ||
                (step === 2 && !selectedDate) ||
                (step === 3 && !selectedTime)
              }
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentBook;