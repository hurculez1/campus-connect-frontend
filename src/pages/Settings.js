import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Settings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery('settings', 
    () => api.get('/users/profile').then(res => res.data.user)
  );

  const updateSettingsMutation = useMutation(
    (data) => api.put('/users/settings', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('settings');
        toast.success('Settings updated');
      },
    }
  );

  const handleToggle = (key, value) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Notifications */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
          <div className="space-y-4">
            <ToggleSetting
              label="Email Notifications"
              description="Receive updates via email"
              checked={settings?.email_notifications}
              onChange={(v) => handleToggle('email_notifications', v)}
            />
            <ToggleSetting
              label="Match Notifications"
              description="Get notified when you have a new match"
              checked={settings?.match_notifications}
              onChange={(v) => handleToggle('match_notifications', v)}
            />
            <ToggleSetting
              label="Message Notifications"
              description="Get notified for new messages"
              checked={settings?.message_notifications}
              onChange={(v) => handleToggle('message_notifications', v)}
            />
          </div>
        </div>

        {/* Privacy */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy</h2>
          <div className="space-y-4">
            <ToggleSetting
              label="Show Online Status"
              description="Let others see when you're online"
              checked={settings?.show_online_status}
              onChange={(v) => handleToggle('show_online_status', v)}
            />
            <ToggleSetting
              label="Show Last Active"
              description="Display when you were last active"
              checked={settings?.show_last_active}
              onChange={(v) => handleToggle('show_last_active', v)}
            />
          </div>
        </div>

        {/* Account */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
          <div className="space-y-4">
            <a href="/subscription" className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Subscription</p>
                <p className="text-sm text-gray-600">Manage your plan</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <a href="/verification" className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Verification</p>
                <p className="text-sm text-gray-600">Verify your student status</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card p-6 border-2 border-red-100">
          <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
          <div className="space-y-4">
            <button className="text-red-600 font-medium hover:text-red-700">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleSetting = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked ? 'bg-primary-500' : 'bg-gray-200'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  </div>
);

export default Settings;
