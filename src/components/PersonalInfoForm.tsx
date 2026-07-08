import React, { useState } from 'react';
import { PersonData } from '../types/numerology';
import { User, Calendar, Users } from 'lucide-react';

interface PersonalInfoFormProps {
  onSubmit: (data: PersonData) => void;
  analysisType: 'numerology' | 'babynames';
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ onSubmit, analysisType }) => {
  const [formData, setFormData] = useState<PersonData>({
    name: '',
    surname: '',
    dateOfBirth: '',
    gender: 'male',
    religion: 'hindu'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For numerology analysis, names are required
    // For baby names, only date of birth and gender are required
    const isValid = analysisType === 'numerology' 
      ? (formData.name && formData.surname && formData.dateOfBirth)
      : formData.dateOfBirth;
      
    if (isValid) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof PersonData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {analysisType === 'numerology' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Enter your first name"
              required
            />
          </div>
          
          <div>
            <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              id="surname"
              value={formData.surname}
              onChange={(e) => handleInputChange('surname', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Enter your last name"
              required
            />
          </div>
        </div>
        )}

        {analysisType === 'babynames' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Baby Name Suggestions</h3>
            <p className="text-blue-700 text-sm">
              AskNameAI will provide numerologically perfect baby names based on your birth chart and missing numbers (1, 3, 5, 6). 
              Names are optional - if provided, we'll analyze and correct them too.
            </p>
          </div>
        )}

        {analysisType === 'babynames' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                First Name (Optional)
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Leave blank for suggestions only"
              />
            </div>
            
            <div>
              <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name (Optional)
              </label>
              <input
                type="text"
                id="surname"
                value={formData.surname}
                onChange={(e) => handleInputChange('surname', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Leave blank for suggestions only"
              />
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date of Birth *
            </label>
            <input
              type="date"
              id="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
          </div>
          
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
              Gender *
            </label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value as 'male' | 'female')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="religion" className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Religion (for baby name suggestions)
          </label>
          <select
            id="religion"
            value={formData.religion}
            onChange={(e) => handleInputChange('religion', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            <option value="hindu">Hindu</option>
            <option value="muslim">Muslim</option>
            <option value="christian">Christian</option>
            <option value="sikh">Sikh</option>
          </select>
        </div>

        {analysisType === 'numerology' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Optional: Parent Information for Enhanced Name Correction</h3>
            <p className="text-blue-700 text-sm mb-4">
              Providing parent initials helps create more powerful name corrections by adding father/mother initials between first name and surname.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fatherInitial" className="block text-sm font-medium text-gray-700 mb-2">
                  Father's First Letter (Optional)
                </label>
                <input
                  type="text"
                  id="fatherInitial"
                  maxLength={1}
                  value={formData.fatherInitial || ''}
                  onChange={(e) => handleInputChange('fatherInitial', e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="e.g., R"
                />
              </div>
              <div>
                <label htmlFor="motherInitial" className="block text-sm font-medium text-gray-700 mb-2">
                  Mother's First Letter (Optional)
                </label>
                <input
                  type="text"
                  id="motherInitial"
                  maxLength={1}
                  value={formData.motherInitial || ''}
                  onChange={(e) => handleInputChange('motherInitial', e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="e.g., S"
                />
              </div>
            </div>
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          {analysisType === 'numerology' ? 'Analyze My Numerology' : 'Get Baby Name Suggestions'}
        </button>
      </form>
    </div>
  );
};