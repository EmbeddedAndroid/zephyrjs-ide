import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { NavbarComponent } from './navbar/index';
import { FooterComponent } from './footer/index';

import { WebUsbService } from './webusb/index';


/**
 * Do not specify providers for modules that might be imported by a lazy loaded
 * module.
 */
@NgModule({
  imports: [
      CommonModule,
      RouterModule
  ],
  declarations: [
      NavbarComponent,
      FooterComponent
  ],
  exports: [
      CommonModule,
      RouterModule,

      NavbarComponent,
      FooterComponent
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: [WebUsbService]
    };
  }
}
