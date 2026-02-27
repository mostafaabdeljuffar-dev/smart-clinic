import { useSessionUser } from '@/store/authStore'
import image from '/guests/guest-1.png'
const UserProfileDropdown = () => {
  const { avatar } = useSessionUser((state) => state.user)
  return (
    <>
      <div className="cursor-pointer flex items-center">
        <img 
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full outline outline-3 outline-offset-[-1.50px] outline-[#D4AF7A]" 
          src={avatar || image} alt='User Photo' 
        />
      </div>
    </>
  )
}

export default UserProfileDropdown
