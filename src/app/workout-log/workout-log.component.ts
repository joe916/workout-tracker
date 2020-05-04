import { Component, OnInit, Input } from '@angular/core';
import { WorkoutService } from '../core/workout.service';

@Component({
  selector: 'app-workout-log',
  templateUrl: './workout-log.component.html',
  styleUrls: ['./workout-log.component.scss']
})
export class WorkoutLogComponent implements OnInit {

  @Input() selectedUserId;

  displayedColumns: string[] = ['workoutName', 'logTime', 'count', 'points'];
  individualLog = true;

  constructor(public workoutService: WorkoutService) { }

  ngOnInit() {
  }

  switchLog(event, value) {
    event.preventDefault();
    event.stopPropagation();
    this.individualLog = value;
  }

}
