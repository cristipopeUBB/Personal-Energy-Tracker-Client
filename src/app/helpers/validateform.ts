import { FormControl, FormGroup } from "@angular/forms";

// This is a common method to validate input forms for Login/Signup components
export default class ValidateForm{
    static validateAllFormFields(formGroup: FormGroup){
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if(control instanceof FormControl){
        control.markAsDirty({onlySelf:true});
      }
      else if(control instanceof FormGroup){
        this.validateAllFormFields(control);
      }
    })
  }
}