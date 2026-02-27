import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { localStorageService } from '@/services/localStorageService';
import { StorageKeys } from '@/constants/localStorageConstants';
import { Switch } from "@headlessui/react"

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    localStorageService.setItem(StorageKeys.LANGUAGE, newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };


  useEffect(() => {
    const savedLang = localStorageService.getItem<string>(StorageKeys.LANGUAGE)
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    }
  }, [i18n]);

  return (
    <Switch
      checked={i18n.language == 'ar'}
      onChange={()=>{
        toggleLanguage();
      }}
      className={`${
        i18n.language == 'ar' ? "bg-[#8B9D83]" : "bg-gray-300"
      } relative inline-flex py-3.5 h-5 w-14 items-center rounded-full transition-colors duration-300 cursor-pointer`}
    >
      <span
        className={`absolute text-[10px] font-semibold text-black end-2 ${i18n.language == 'ar' ? "opacity-0" : "opacity-100"}`}
      >
        EN
      </span>
      <span
        className={`absolute text-[10px] font-semibold text-white start-2 ${i18n.language == 'ar' ? "opacity-100" : "opacity-0"}`}
      >
        AR
      </span>
      <span
        className={`${i18n.language == 'ar' ? "-translate-x-8" : "translate-x-1"} inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-300`}
      />
    </Switch>
  );
}

export default LanguageSwitcher;
